# Screend - TV Show Tracking Platform

A full-stack web application for tracking TV shows, similar to Letterboxd but focused on TV shows and episodes.

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Caching**: Redis
- **Authentication**: JWT + secure cookies
- **TV Data**: The Movie Database (TMDb) API

## Project Structure

```
screend/
├── backend/          # Express.js API server
├── frontend/         # Next.js frontend application
├── docs/             # Documentation
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- TMDb API key (get one at https://www.themoviedb.org/settings/api)

### Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Set up environment variables:**

   Backend (`.env` in `backend/`):
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/screend
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-super-secret-jwt-key
   TMDB_API_KEY=your-tmdb-api-key
   PORT=5000
   NODE_ENV=development
   ```

   Frontend (`.env.local` in `frontend/`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

3. **Set up database:**
   ```bash
   cd backend
   npm run migrate
   ```

4. **Start Redis:**
   ```bash
   redis-server
   ```

5. **Run development servers:**
   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## Features

- ✅ User authentication (register, login, JWT)
- ✅ TV show discovery and search
- ✅ Episode tracking and logging
- ✅ Ratings and reviews
- ✅ Watchlists
- ✅ Custom lists
- ✅ Social features (follow, like, comment)
- ✅ Activity feed
- ✅ Trending shows
- ✅ User profiles

## Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed system architecture.

## API Documentation

See [docs/API.md](./docs/API.md) for API endpoint documentation.

## Database Schema

See [docs/DATABASE.md](./docs/DATABASE.md) for database schema details.

## Development Plan

See [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) for step-by-step development guide.
