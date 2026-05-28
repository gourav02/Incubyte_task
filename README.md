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

### Backend Setup
```bash
cd server
npm install
cp .env.example .env   # Configure your database credentials
npm run migrate         # Run database migrations
npm run seed            # Seed 10,000 employees
npm run dev             # Start dev server on port 3001
```

### Frontend Setup
```bash
cd client
npm install
npm run dev             # Start dev server on port 5173
```

### Running Tests
```bash
# Backend tests
cd server && npm test

# Frontend tests
cd client && npm test
```

## Features

- **Employee Management**: Add, view, update, and delete employees
- **Salary Insights**: Min/max/avg salary by country, avg salary by job title per country
- **Seeded Data**: 10,000 employees generated from first_names.txt and last_names.txt
