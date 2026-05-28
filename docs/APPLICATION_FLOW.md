# Application Flow — End-to-End Deep Dive

This document walks through every layer of the Salary Management Tool, from the React frontend to the Express backend to the PostgreSQL database, explaining how they connect and what happens at each step.

---

## 1. Architecture Overview

```
┌─────────────────────────────┐
│     React Frontend          │  Port 5173 (Vite dev server)
│  (TypeScript + Tailwind v4  │
│   + shadcn/ui components)   │
└──────────┬──────────────────┘
           │  HTTP (proxied /api/* → localhost:3001)
           ▼
┌─────────────────────────────┐
│     Express Backend         │  Port 3001
│  (TypeScript + Knex ORM)    │
│  Routes → Repositories      │
└──────────┬──────────────────┘
           │  SQL (via Knex query builder)
           ▼
┌─────────────────────────────┐
│     PostgreSQL Database     │  Port 5432
│  employees table            │
│  (UUID PK, indexes on       │
│   country, job_title)       │
└─────────────────────────────┘
```

### Key Design Decisions
- **Monorepo**: `server/` and `client/` live side-by-side under one Git repo.
- **No ORM overhead**: Knex is used as a query builder (not a full ORM), giving us raw SQL control with TypeScript safety.
- **Proxy pattern**: Vite proxies `/api/*` to the backend, so the frontend never deals with CORS in development.
- **Repository pattern**: Business logic is separated from route handlers via repository classes, making testing and swapping DB implementations easy.

---

## 2. Database Layer

### 2.1 Schema (Migration)

**File**: `server/src/migrations/20240101000000_create_employees.ts`

```sql
-- What Knex generates under the hood:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE employees (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name   VARCHAR(200)   NOT NULL,
  job_title   VARCHAR(100)   NOT NULL,
  country     VARCHAR(100)   NOT NULL,
  salary      DECIMAL(12,2)  NOT NULL,
  department  VARCHAR(100)   NOT NULL,
  hire_date   DATE           NOT NULL,
  created_at  TIMESTAMPTZ    DEFAULT NOW(),
  updated_at  TIMESTAMPTZ    DEFAULT NOW()
);

CREATE INDEX idx_employees_country ON employees(country);
CREATE INDEX idx_employees_job_title ON employees(job_title);
CREATE INDEX idx_employees_country_job_title ON employees(country, job_title);
```

**Why these indexes?**
- `idx_employees_country`: Speeds up filtering employees by country and GROUP BY in insights.
- `idx_employees_job_title`: Speeds up filtering by job title.
- `idx_employees_country_job_title`: Composite index for the `getSalaryByJobTitle` query which groups by both.

**Why UUID?**
- UUIDs avoid sequential ID guessing (security), allow distributed ID generation, and don't conflict when merging data from multiple sources.

### 2.2 Database Configuration

**File**: `server/src/config/database.ts`

```typescript
// Knex is initialized with environment-specific config:
// - development → salary_management database
// - test        → salary_management_test database (isolated for tests)
const environment = process.env.NODE_ENV || "development";
export const db = knex(dbConfig[environment]);
```

**Connection pooling**: `min: 2, max: 10` — maintains 2 idle connections and scales up to 10 under load.

### 2.3 Seed Script

**File**: `server/src/seeds/seed_employees.ts`

- Reads `first_names.txt` (50 names) and `last_names.txt` (100 names) from disk.
- Generates 10,000 employees by randomly combining names, job titles, countries, departments, salaries, and hire dates.
- Uses **batch inserts** of 1,000 rows per `INSERT` statement (via `knex.batchInsert`).
- Performance: **~367ms** for 10,000 rows.

```
10,000 employees = 10 batches × 1,000 rows per INSERT
```

---

## 3. Backend Layer (Express + TypeScript)

### 3.1 App Initialization

**File**: `server/src/app.ts`

```typescript
const app = express();
app.use(cors());              // Allow cross-origin requests
app.use(express.json());      // Parse JSON request bodies
app.get("/api/health", ...);  // Health check endpoint
app.use("/api/employees", employeeRoutes);  // CRUD routes
app.use("/api/insights", insightsRoutes);   // Analytics routes
```

**File**: `server/src/server.ts` — starts listening on PORT 3001.

### 3.2 Repository Pattern

The backend uses the **Repository Pattern** to separate data access from route handling:

```
Route Handler (receives HTTP request)
    ↓ calls
Repository Method (builds SQL query via Knex)
    ↓ executes
PostgreSQL (returns rows)
    ↓ maps
TypeScript Interface (type-safe response)
```

#### EmployeeRepository (`server/src/repositories/employee.repository.ts`)

| Method                | SQL Operation                     | Description                          |
|-----------------------|-----------------------------------|--------------------------------------|
| `findAll(page, limit, search, country, jobTitle)` | `SELECT * ... ILIKE ... OFFSET ... LIMIT` | Paginated list with optional filters |
| `findById(id)`        | `SELECT * WHERE id = ?`           | Single employee by UUID              |
| `create(data)`        | `INSERT ... RETURNING *`          | Create and return the new row        |
| `update(id, data)`    | `UPDATE ... WHERE id = ? RETURNING *` | Partial update, return updated row |
| `delete(id)`          | `DELETE WHERE id = ?`             | Returns boolean (was row found?)     |
| `getDistinctCountries()` | `SELECT DISTINCT country ORDER BY country` | For filter dropdowns       |
| `getDistinctJobTitles()` | `SELECT DISTINCT job_title ORDER BY job_title` | For filter dropdowns   |

**Pagination implementation** (in `findAll`):
```typescript
// 1. Count total matching rows (for "totalPages" calculation)
const countResult = await query.clone().count("id as total").first();
// 2. Fetch the page slice
const data = await query.clone().select("*").orderBy("created_at", "desc").offset(offset).limit(limit);
// 3. Return both
return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
```

The `query.clone()` is critical — without it, Knex would mutate the query object and the second call would fail.

**Search** uses PostgreSQL `ILIKE` for case-insensitive partial name matching:
```sql
WHERE full_name ILIKE '%john%'
```

#### InsightsRepository (`server/src/repositories/insights.repository.ts`)

| Method               | SQL Operation                                    | Description                                 |
|----------------------|--------------------------------------------------|---------------------------------------------|
| `getSalaryByCountry(country?)` | `SELECT country, MIN(salary), MAX(salary), AVG(salary), COUNT(*) GROUP BY country` | Salary stats per country |
| `getSalaryByJobTitle(country?)` | `SELECT country, job_title, AVG(salary), COUNT(*) GROUP BY country, job_title` | Avg salary per job title per country |
| `getSummary()`       | `COUNT(*)`, `AVG(salary)`, `MIN(salary)`, `MAX(salary)`, `COUNT(DISTINCT country)`, `COUNT(DISTINCT job_title)` | Overall summary |

**Number precision**: Results are rounded to 2 decimal places:
```typescript
avg_salary: Math.round(Number(row.avg_salary) * 100) / 100
```

### 3.3 API Routes

#### Employee Routes (`/api/employees`)

| Method | Endpoint               | Handler                   | Response          |
|--------|------------------------|---------------------------|-------------------|
| GET    | `/api/employees`       | List with pagination/filter | `PaginatedResponse<Employee>` |
| GET    | `/api/employees/:id`   | Get single employee       | `Employee` or 404 |
| POST   | `/api/employees`       | Create employee           | `Employee` (201)  |
| PUT    | `/api/employees/:id`   | Update employee           | `Employee` or 404 |
| DELETE | `/api/employees/:id`   | Delete employee           | 204 or 404        |
| GET    | `/api/employees/countries` | Distinct countries     | `string[]`        |
| GET    | `/api/employees/job-titles` | Distinct job titles   | `string[]`        |

**Validation** (in POST `/api/employees`):
```typescript
if (!full_name || !job_title || !country || salary == null || !department || !hire_date) {
  return res.status(400).json({ error: "All fields are required" });
}
if (typeof salary !== "number" || salary < 0) {
  return res.status(400).json({ error: "Salary must be a non-negative number" });
}
```

#### Insights Routes (`/api/insights`)

| Method | Endpoint                   | Handler               | Response                    |
|--------|----------------------------|-----------------------|-----------------------------|
| GET    | `/api/insights/by-country` | Salary by country     | `SalaryInsightByCountry[]`  |
| GET    | `/api/insights/by-job-title` | Salary by job title | `SalaryInsightByJobTitle[]` |
| GET    | `/api/insights/summary`    | Overall summary       | `SalarySummary`             |

### 3.4 Type System

**File**: `server/src/types/employee.ts`

Both frontend and backend share the same interface shapes (defined independently in each project):

```typescript
interface Employee {
  id: string;          // UUID
  full_name: string;
  job_title: string;
  country: string;
  salary: number;
  department: string;
  hire_date: string;   // ISO date string
  created_at: string;
  updated_at: string;
}
```

---

## 4. Frontend Layer (React + TypeScript + Vite)

### 4.1 Project Setup

```
client/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui primitives (Button, Input, Table, etc.)
│   │   ├── EmployeeForm.tsx # Create/Edit form with validation
│   │   ├── EmployeeTable.tsx# Paginated list with CRUD
│   │   └── SalaryInsights.tsx# Dashboard with paginated tables
│   ├── lib/
│   │   ├── api.ts           # HTTP client (fetch wrapper)
│   │   └── utils.ts         # cn() helper for Tailwind class merging
│   ├── types/
│   │   └── employee.ts      # TypeScript interfaces (mirrors backend)
│   ├── __tests__/           # Vitest + React Testing Library tests
│   ├── App.tsx              # Root component with tab navigation
│   ├── main.tsx             # React entry point
│   └── index.css            # Tailwind v4 + shadcn theme variables
├── vite.config.ts           # Vite + Vitest config + API proxy
└── package.json
```

### 4.2 API Proxy

**File**: `client/vite.config.ts`

```typescript
server: {
  proxy: {
    "/api": "http://localhost:3001",
  },
},
```

**How it works**: When the browser makes a request to `http://localhost:5173/api/employees`, Vite's dev server intercepts it and forwards it to `http://localhost:3001/api/employees`. The browser never talks to port 3001 directly, avoiding CORS issues entirely.

### 4.3 API Client

**File**: `client/src/lib/api.ts`

```typescript
async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }
  if (response.status === 204) return undefined as T;  // DELETE returns no body
  return response.json();
}
```

This is a generic typed wrapper around `fetch` that:
1. Sets JSON headers automatically.
2. Throws on non-2xx responses with the server's error message.
3. Handles 204 No Content (for DELETE).

### 4.4 Component Architecture

#### App.tsx — Root Layout
```
┌─────────────────────────────────────────┐
│ Header: "Salary Manager" + Nav Tabs     │
│  [Employees] [Insights]                 │
├─────────────────────────────────────────┤
│ activeTab === "employees"               │
│   → <EmployeeTable />                   │
│ activeTab === "insights"                │
│   → <SalaryInsights />                  │
└─────────────────────────────────────────┘
```

Uses React `useState<Tab>` to toggle between views. No routing library needed for two tabs.

#### EmployeeTable.tsx — Main CRUD View

**Data fetching pattern** (custom hooks + refreshKey):
```typescript
function useEmployees(page, search, countryFilter, refreshKey) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    employeeApi.getAll({ page, search, country: countryFilter })
      .then((result) => { if (!cancelled) { setData(result); setIsLoading(false); } })
      .catch(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [page, search, countryFilter, refreshKey]);

  return { data, isLoading };
}
```

**Why `refreshKey`?** After creating/updating/deleting an employee, we increment `refreshKey` which triggers the `useEffect` to re-fetch. This avoids directly calling `setState` inside the effect (which triggers React 19 warnings) and provides a clean, declarative refresh mechanism.

**Why `cancelled` flag?** Prevents stale state updates if the component unmounts or the effect re-runs before the previous fetch completes (race condition prevention).

**User flow — Creating an Employee**:
```
1. User clicks "Add Employee" button
2. Dialog opens with <EmployeeForm />
3. User fills all mandatory fields (all marked with *)
4. User clicks "Create"
5. Frontend validation runs (full_name, salary > 0, etc.)
6. If valid: employeeApi.create(formData) → POST /api/employees
7. Backend validates all fields present + salary >= 0
8. Knex INSERT with RETURNING * → returns new Employee with UUID
9. Frontend increments refreshKey → useEffect re-fetches list
10. Dialog closes, new employee appears in table
```

**User flow — Searching/Filtering**:
```
1. User types in search box → updates `search` state (debounced via effect)
2. useEffect triggers with new search value
3. GET /api/employees?page=1&search=john
4. Backend: SELECT * FROM employees WHERE full_name ILIKE '%john%' LIMIT 20
5. Frontend renders filtered results with updated pagination
```

#### EmployeeForm.tsx — Create/Edit Form

**All 6 fields are mandatory** (as per requirements):

| Field       | Input Type | Validation                     |
|-------------|------------|--------------------------------|
| Full Name * | Text input | Must not be empty              |
| Job Title * | Select     | Pre-populated, always has value |
| Department *| Select     | Pre-populated, always has value |
| Country *   | Select     | Pre-populated, always has value |
| Salary *    | Number     | Must be > 0                    |
| Hire Date * | Date       | Must not be empty              |

**Dual validation**:
- **Frontend**: JS validation in `validate()` before submit — instant feedback.
- **Backend**: Express route validates again — security layer (never trust the client).

#### SalaryInsights.tsx — Analytics Dashboard

```
┌──────────────────────────────────────────────────┐
│ [Summary Cards]                                   │
│ Total Employees | Avg Salary | Countries | Titles │
├──────────────────────────┬───────────────────────┤
│ Salary by Country (paged)│ Salary by Job Title   │
│ Country|Min|Max|Avg|Count│ (paged)               │
│ [Prev] Page 1/2 [Next]  │ Country|Title|Avg|Count│
│                          │ [Prev] Page 1/5 [Next]│
└──────────────────────────┴───────────────────────┘
```

**Pagination hook** (`usePagination`):
```typescript
function usePagination<T>(items: T[], pageSize = 5) {
  const [page, setPage] = useState(1);
  const paginatedItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );
  return { page, totalPages, items: paginatedItems, setPage, start, end, total };
}
```

This is **client-side pagination** because the insights data is already aggregated (10 countries × 10 job titles = 100 rows max — fits in memory).

**Data flow for Salary by Country**:
```
1. SalaryInsights mounts
2. useCountryInsights("") fires → GET /api/insights/by-country
3. Backend: SELECT country, MIN(salary), MAX(salary), AVG(salary), COUNT(*)
           FROM employees GROUP BY country ORDER BY country
4. Returns 10 rows (one per country)
5. usePagination slices into pages of 5
6. Renders first 5 rows with "Showing 1–5 of 10" and Prev/Next buttons
7. User clicks Next → page 2 → rows 6–10 rendered instantly (no API call)
```

**Country filter dropdown**:
```
1. User selects "USA" from dropdown
2. setCountryFilter("USA") triggers both useCountryInsights and useJobTitleInsights
3. GET /api/insights/by-country?country=USA
4. Backend: ... WHERE country = 'USA' GROUP BY country
5. Returns 1 row (just USA)
6. GET /api/insights/by-job-title?country=USA
7. Backend: ... WHERE country = 'USA' GROUP BY country, job_title
8. Returns 10 rows (one per job title in USA)
```

---

## 5. Request Lifecycle — Full Example

### Example: "Create a new employee named John Doe"

```
FRONTEND                          BACKEND                           DATABASE
────────                          ───────                           ────────
1. User fills form, clicks        
   "Create"                       
                                  
2. validate() checks:             
   - full_name ≠ ""  ✓           
   - salary > 0      ✓           
   - hire_date ≠ ""  ✓           
                                  
3. employeeApi.create({           
     full_name: "John Doe",       
     job_title: "Software Engineer",
     country: "USA",              
     salary: 85000,               
     department: "Engineering",   
     hire_date: "2024-01-15"      
   })                             
                                  
4. fetch("http://localhost:5173   
   /api/employees", {             
     method: "POST",              
     body: JSON.stringify(data)   
   })                             
                                  
5. Vite proxy intercepts          
   → forwards to                  
   http://localhost:3001           
   /api/employees                 
                                  
                                  6. express.json() parses body
                                  
                                  7. Route handler validates:
                                     - All fields present?  ✓
                                     - salary is number?    ✓
                                     - salary >= 0?         ✓
                                  
                                  8. repo.create(data)
                                     → this.db("employees")
                                       .insert(data)
                                       .returning("*")
                                                                    
                                                                    9. INSERT INTO employees
                                                                       (full_name, job_title,
                                                                        country, salary,
                                                                        department, hire_date)
                                                                       VALUES ($1,$2,$3,$4,$5,$6)
                                                                       RETURNING *;
                                                                    
                                                                    10. PostgreSQL:
                                                                        - Generates UUID v4
                                                                        - Sets created_at, updated_at
                                                                        - Returns full row
                                  
                                  11. res.status(201).json(employee)
                                  
12. fetch resolves with           
    201 response                  
                                  
13. response.json() → Employee    
    object with id, timestamps    
                                  
14. onSubmit callback fires       
    → setRefreshKey(k + 1)        
    → Dialog closes               
                                  
15. useEffect detects             
    refreshKey changed            
    → GET /api/employees?page=1   
                                  
16. Table re-renders with         
    new employee at top           
    (ordered by created_at DESC)  
```

---

## 6. Testing Strategy

### 6.1 Backend Tests (Jest + Supertest)

| Suite | What It Tests | How |
|-------|--------------|-----|
| `employee.repository.test.ts` | All CRUD operations, pagination, search, filters | Uses real test DB, runs migrations, cleans up |
| `insights.repository.test.ts` | Aggregation queries (min/max/avg/count), summary | Seeds known data, asserts exact numbers |
| `employee.routes.test.ts` | HTTP status codes, validation errors, request/response format | Supertest makes HTTP calls to Express app |
| `insights.routes.test.ts` | Insights endpoints, query param handling | Supertest with assertion on response shape |
| `seed.test.ts` | Name files exist, have correct count | File system assertions |
| `app.test.ts` | Health check endpoint | Supertest GET /api/health |

**Test isolation**: Each test suite runs against `salary_management_test` database. Migrations run at suite start, and test data is cleaned between tests.

### 6.2 Frontend Tests (Vitest + React Testing Library)

| Suite | What It Tests | How |
|-------|--------------|-----|
| `App.test.tsx` | Tab navigation, component rendering | Mocks child components, clicks tabs |
| `EmployeeForm.test.tsx` | All 6 mandatory fields, validation errors, submit payload, pre-fill for edit | Renders form, types input, asserts errors |
| `SalaryInsights.test.tsx` | Summary cards, pagination rendering, page navigation | Mocks API, asserts "Showing X of Y" text |
| `api.test.ts` | Fetch calls, URL params, error handling | Mocks `globalThis.fetch`, asserts call args |

### 6.3 TDD Workflow

Every feature followed Red → Green → Refactor:

1. **Red**: Write failing test (e.g., "should show validation error when salary is zero").
2. **Green**: Implement the minimum code to make it pass.
3. **Refactor**: Clean up without breaking tests.
4. **Commit**: Each commit message shows what was tested and implemented.

---

## 7. Potential Interview Follow-up Q&A

### Q: Why Knex instead of an ORM like Prisma or TypeORM?
**A**: Knex is a query builder, not a full ORM. For this project, we need direct SQL control (aggregations, GROUP BY, DISTINCT, ILIKE). Knex gives us type-safe query building without the overhead of entity mapping, lazy loading, or migration generation that ORMs add. It's also lighter weight for a focused project like this.

### Q: How does the frontend-backend proxy work?
**A**: Vite's dev server intercepts any request starting with `/api` and forwards it to `http://localhost:3001`. The browser thinks it's talking to the same origin (port 5173), so there are no CORS issues. In production, you'd configure nginx or a CDN to do the same routing.

### Q: Why client-side pagination for insights but server-side for employees?
**A**: Employees can be 10,000+ rows — too much to load at once. Server-side pagination (`OFFSET/LIMIT`) sends only 20 rows per page. Insights data is already aggregated (10 countries × 10 job titles = 100 rows max), so it fits in memory and client-side pagination avoids extra API calls when navigating pages.

### Q: How do you handle race conditions in data fetching?
**A**: Each `useEffect` creates a `cancelled` flag. When the effect re-runs (new search term, page change), the cleanup function sets `cancelled = true`. If the old fetch resolves after the new one starts, the stale `setState` is skipped.

### Q: Why UUID primary keys instead of auto-increment integers?
**A**: UUIDs are globally unique, don't reveal record count or creation order, and can be generated client-side or across distributed systems. The trade-off is slightly larger storage and slower indexing vs integers, but for 10K records this is negligible.

### Q: How does the seed script achieve fast inserts?
**A**: Instead of 10,000 individual `INSERT` statements (which would require 10,000 round trips to PostgreSQL), we use `knex.batchInsert` which groups them into batches of 1,000 rows per `INSERT` statement. This means only 10 round trips, achieving ~367ms total.

### Q: What happens if the backend is down when the frontend loads?
**A**: The `fetchJSON` wrapper catches non-ok responses and throws errors. The custom hooks (e.g., `useEmployees`) have `.catch()` handlers that set `isLoading: false` but leave `data: null`. The UI would show the loading state then empty/error state. In production, you'd add toast notifications or error boundaries.

### Q: Why not use React Query or SWR for data fetching?
**A**: For this project scope (2 data-fetching components), custom hooks with `useState` + `useEffect` are sufficient and avoid adding another dependency. React Query would be justified at scale for caching, deduplication, background refetching, and optimistic updates.

### Q: How is the backend validated separately from the frontend?
**A**: Frontend validation provides instant UX feedback (no network round trip). Backend validation is the security layer — it re-validates everything because you can't trust client-side code (users can disable JS, use curl, etc.). Both layers validate: required fields, salary type/range.

### Q: How would you deploy this to production?
**A**: 
- **Database**: Managed PostgreSQL (AWS RDS, Railway, Neon).
- **Backend**: Deploy `server/` to Railway/Render as a Node.js service. Set `NODE_ENV=production`.
- **Frontend**: Build with `npm run build` → static files in `dist/`. Deploy to Vercel/Netlify with a rewrite rule: `/api/*` → backend URL.
- **Alternative**: Docker Compose with three containers (pg, backend, nginx serving frontend).

### Q: How do the indexes improve performance?
**A**: Without indexes, every query that filters by `country` or `job_title` would do a sequential scan of all 10,000 rows. With indexes:
- `WHERE country = 'USA'` → B-tree index lookup: O(log n) instead of O(n).
- `GROUP BY country, job_title` → composite index allows PostgreSQL to scan the index directly without touching the heap.
- For 10K rows the difference is small (~2ms vs ~5ms), but at 1M+ rows, it becomes critical.

### Q: What's the `refreshKey` pattern?
**A**: Instead of imperatively calling a `refetch()` function after mutations, we increment a counter (`refreshKey`) in the dependency array of `useEffect`. When it changes, React re-runs the effect, which re-fetches data. This is a declarative, React-idiomatic approach that avoids the "setState in useEffect" warning in React 19's strict mode.
