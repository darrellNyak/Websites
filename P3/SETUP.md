# Screend Setup Guide

Quick setup guide to get Screend running locally.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- TMDb API key ([Get one here](https://www.themoviedb.org/settings/api))

## Option 1: Docker Compose (Recommended)

The easiest way to set up the database and Redis:

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Wait a few seconds for services to start, then continue with setup
```

## Option 2: Manual Setup

### PostgreSQL

```bash
# Create database
createdb screend

# Or using psql
psql -U postgres
CREATE DATABASE screend;
\q
```

### Redis

```bash
# Start Redis (varies by OS)
# macOS with Homebrew:
brew services start redis

# Linux:
sudo systemctl start redis

# Or run directly:
redis-server
```

## Installation

1. **Install dependencies:**

```bash
# Root
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. **Set up environment variables:**

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://screend:screend_password@localhost:5432/screend
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
TMDB_API_KEY=your-tmdb-api-key-here
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

3. **Run database migrations:**

```bash
cd backend
npm run migrate:dev
```

Or if using compiled version:
```bash
cd backend
npm run build
npm run migrate
```

4. **Start development servers:**

**Option A: Run separately (recommended for development)**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

**Option B: Run together (from root)**
```bash
npm run dev
```

5. **Access the application:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## First Steps

1. **Register an account:**
   - Visit http://localhost:3000/register
   - Create your account

2. **Search for a show:**
   - Visit http://localhost:3000/discover
   - Search for "Breaking Bad" or any show
   - Click on a show to view details

3. **Add to watchlist:**
   - On a show page, click "+ Watchlist"
   - View your watchlist at http://localhost:3000/watchlist

4. **Follow users:**
   - Visit a user profile
   - Click "Follow"
   - View your feed at http://localhost:3000/feed

## Troubleshooting

### Database Connection Error

```bash
# Check if PostgreSQL is running
pg_isready

# Check connection
psql -U screend -d screend -h localhost
```

### Redis Connection Error

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG
```

### Port Already in Use

If port 5000 or 3000 is already in use:

```bash
# Backend - change PORT in backend/.env
PORT=5001

# Frontend - change in package.json or use:
npm run dev -- -p 3001
```

### Migration Errors

If migrations fail:

```bash
# Drop and recreate database (WARNING: deletes all data)
dropdb screend
createdb screend
cd backend
npm run migrate:dev
```

### TMDb API Errors

- Verify your API key is correct
- Check API key has proper permissions
- TMDb has rate limits (40 requests per 10 seconds)

## Development Tips

1. **Database Changes:**
   - Edit `backend/src/db/schema.sql`
   - Re-run migrations (will recreate tables - data will be lost)

2. **API Testing:**
   - Use Postman or curl
   - Or visit API endpoints directly in browser

3. **Frontend Hot Reload:**
   - Next.js automatically reloads on file changes
   - Check browser console for errors

4. **Backend Hot Reload:**
   - Nodemon automatically restarts on file changes
   - Check terminal for errors

## Next Steps

- Read [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for detailed development guide
- Read [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for system architecture
- Read [API.md](./docs/API.md) for API documentation

## Production Deployment

See deployment instructions in:
- [docs/SCALING.md](./docs/SCALING.md) - Scaling guide
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Architecture details
