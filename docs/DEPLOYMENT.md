# Deployment Guide

## Local Development (Current)

Both servers run locally:
- **Backend**: `http://localhost:3001` (Express API)
- **Frontend**: `http://localhost:5173` (Vite dev server with API proxy)

## Production Deployment Options

### Option 1: Railway / Render (Recommended)

**Backend (Railway/Render):**
1. Create a PostgreSQL database on Railway/Render
2. Deploy the `server/` directory as a Node.js service
3. Set environment variables: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT`, `NODE_ENV=production`
4. Build command: `npm run build`
5. Start command: `npm start`
6. Run seed: `npm run seed` (one-time)

**Frontend (Vercel/Netlify):**
1. Deploy the `client/` directory
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Set environment variable for API URL or configure proxy/rewrites

### Option 2: Docker (Self-hosted)

A `docker-compose.yml` could be added to run:
- PostgreSQL container
- Backend container
- Frontend container (nginx serving built static files)

## Video Demo

To record a video demo of the working software:
1. Start both servers locally (`npm run dev` in both `server/` and `client/`)
2. Use screen recording (e.g., QuickTime on Mac, OBS)
3. Demonstrate:
   - Employee list with pagination
   - Search and filter functionality
   - Adding a new employee
   - Editing an employee
   - Deleting an employee
   - Salary insights dashboard
   - Country filter on insights
