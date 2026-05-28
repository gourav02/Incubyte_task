# Salary Management Tool

A minimal yet usable salary management tool for an organization with 10,000 employees.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + shadcn/ui + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Testing**: Jest (backend), Vitest + React Testing Library (frontend)

## Project Structure

```
├── server/          # Backend API (Node.js + Express + TypeScript)
├── client/          # Frontend (React + TypeScript + Vite)
├── docs/            # Planning docs, architecture notes, AI usage log
└── README.md
```

## Getting Started

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 14

### Database Setup
```bash
createdb salary_management
createdb salary_management_test
```

### Backend Setup
```bash
cd server
npm install
cp .env.example .env   # Configure your database credentials
npm run seed            # Run migrations + seed 10,000 employees
npm run dev             # Start dev server on port 3001
```

### Frontend Setup
```bash
cd client
npm install
npm run dev             # Start dev server on port 5173
```

Open http://localhost:5173 in your browser.

### Running Tests
```bash
# Backend tests (43 tests across 6 suites)
cd server && npm test

# Frontend tests (20 tests across 3 suites)
cd client && npm test
```

## Features

- **Employee Management**: Add, view, update, and delete employees via UI
- **Search & Filter**: Search employees by name, filter by country
- **Pagination**: Server-side pagination for handling 10,000+ records
- **Salary Insights**: Min/max/avg salary by country, avg salary by job title per country
- **Summary Dashboard**: Total employees, average salary, country/job title counts
- **Seeded Data**: 10,000 employees generated from first_names.txt and last_names.txt
- **Performant Seeding**: Batch inserts of 1,000 rows — seeds 10K records in ~400ms

## Test Coverage

| Layer | Framework | Tests | Suites |
|-------|-----------|-------|--------|
| Backend Repository | Jest | 21 | 2 |
| Backend API Routes | Jest + Supertest | 19 | 2 |
| Backend Seed Validation | Jest | 3 | 1 |
| Frontend Components | Vitest + RTL | 12 | 2 |
| Frontend API Client | Vitest | 8 | 1 |
| **Total** | | **63** | **8** |
