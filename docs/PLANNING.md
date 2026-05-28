# Salary Management Tool - Planning & Design Notes

## Problem Statement
Build a minimal yet usable salary management tool for an organization with 10,000 employees, targeting an HR Manager persona.

## Architecture Overview

```
┌─────────────────────┐     ┌──────────────────────┐     ┌──────────────┐
│   React Frontend    │────▶│  Node.js/Express API  │────▶│  PostgreSQL  │
│   (TypeScript)      │◀────│    (TypeScript)       │◀────│   Database   │
│   shadcn/ui         │     │    REST endpoints     │     │              │
└─────────────────────┘     └──────────────────────┘     └──────────────┘
```

## Tech Stack
- **Frontend**: React + TypeScript + Vite + shadcn/ui + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Testing**: Jest (backend), Vitest + React Testing Library (frontend)
- **ORM**: Knex.js (query builder for PostgreSQL)

## Data Model

### Employee Table
| Column       | Type         | Constraints          |
|-------------|-------------|---------------------|
| id          | UUID        | PK, auto-generated  |
| full_name   | VARCHAR(200)| NOT NULL             |
| job_title   | VARCHAR(100)| NOT NULL             |
| country     | VARCHAR(100)| NOT NULL             |
| salary      | DECIMAL(12,2)| NOT NULL, >= 0      |
| department  | VARCHAR(100)| NOT NULL             |
| hire_date   | DATE        | NOT NULL             |
| created_at  | TIMESTAMP   | DEFAULT NOW()        |
| updated_at  | TIMESTAMP   | DEFAULT NOW()        |

### Indexes
- `idx_employees_country` on `country` - for country-based salary insights
- `idx_employees_job_title` on `job_title` - for job title salary queries
- `idx_employees_country_job_title` on `(country, job_title)` - composite for combined queries

## API Design

### Employee CRUD
- `GET    /api/employees`       - List employees (paginated, filterable)
- `GET    /api/employees/:id`   - Get single employee
- `POST   /api/employees`       - Create employee
- `PUT    /api/employees/:id`   - Update employee
- `DELETE /api/employees/:id`   - Delete employee

### Salary Insights
- `GET /api/insights/by-country`           - Min, max, avg salary per country
- `GET /api/insights/by-country/:country`  - Salary stats for a specific country
- `GET /api/insights/by-job-title`         - Avg salary by job title per country
- `GET /api/insights/summary`             - Overall org-wide salary summary

## Seeding Strategy
- Use `first_names.txt` and `last_names.txt` to generate 10,000 employee names
- Batch insert using PostgreSQL COPY or multi-row INSERT for performance
- Use realistic salary ranges based on country/job title
- Batch size: 1000 rows per insert for optimal performance

## Key Design Decisions

1. **Knex.js over Prisma/TypeORM**: Lighter weight, better control over raw SQL for aggregation queries, faster for seed scripts.

2. **UUID primary keys**: Better for distributed systems, no sequential ID leaking.

3. **Pagination**: Server-side pagination with cursor/offset for handling 10,000+ records efficiently.

4. **Department field**: Added beyond requirements as meaningful data for HR context.

5. **Hire date field**: Useful for tenure-based insights, relevant to HR persona.

## Trade-offs

- **PostgreSQL vs SQLite**: PostgreSQL chosen for better concurrency, real-world relevance, and superior aggregate function support. Trade-off is setup complexity.
- **REST vs GraphQL**: REST chosen for simplicity and alignment with CRUD operations. GraphQL would be over-engineering for this scope.
- **Server-side pagination**: Adds complexity but essential for 10,000 records.

## Performance Considerations

- Database indexes on frequently queried columns (country, job_title)
- Batch inserts in seed script (1000 rows/batch) vs row-by-row
- Server-side pagination to avoid loading all 10K records
- Materialized views or cached aggregations could be added for insights if needed
