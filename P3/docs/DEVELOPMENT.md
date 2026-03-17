# Screend Development Guide

## MVP Development Plan (24-48 Hours)

This guide outlines the step-by-step process to build the Screend MVP.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Redis 6+ installed and running
- TMDb API key ([Get one here](https://www.themoviedb.org/settings/api))
- Git installed

## Step 1: Project Setup

### 1.1 Clone and Install

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 1.2 Environment Setup

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/screend
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
TMDB_API_KEY=your-tmdb-api-key
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 1.3 Database Setup

```bash
# Create database
createdb screend

# Run migrations
cd backend
npm run migrate:dev
```

## Step 2: User Authentication System

### 2.1 Backend Implementation

✅ **Already implemented** in:
- `backend/src/routes/auth.ts` - Auth routes
- `backend/src/middleware/auth.ts` - Auth middleware

### 2.2 Frontend Implementation

✅ **Already implemented** in:
- `frontend/src/app/login/page.tsx` - Login page
- `frontend/src/app/register/page.tsx` - Register page
- `frontend/src/lib/api.ts` - API client with auth

### 2.3 Test Authentication

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Visit http://localhost:3000/register
4. Create an account
5. Test login/logout

## Step 3: Import Shows from API

### 3.1 TMDb Integration

✅ **Already implemented** in:
- `backend/src/services/tmdb.ts` - TMDb service
- `backend/src/routes/shows.ts` - Show routes with sync

### 3.2 Test Show Import

1. Search for a show via `/api/shows/search?q=breaking+bad`
2. View show details via `/api/shows/1396` (Breaking Bad TMDB ID)
3. Verify data is stored in database

## Step 4: Show Pages + Episode Lists

### 4.1 Frontend Pages

✅ **Already implemented** in:
- `frontend/src/app/shows/[id]/page.tsx` - Show detail page
- `frontend/src/app/discover/page.tsx` - Discovery page

### 4.2 Test Show Pages

1. Visit http://localhost:3000/discover
2. Search for a show
3. Click on a show to view details
4. Verify seasons and episodes load

## Step 5: Episode Logging System

### 5.1 Backend Implementation

✅ **Already implemented** in:
- `backend/src/routes/episodes.ts` - Episode logging routes

### 5.2 Frontend Implementation

**To be added**: Episode logging UI on show pages

### 5.3 Test Episode Logging

1. Navigate to a show page
2. Click on a season
3. Log an episode with rating/review
4. Verify log appears in database

## Step 6: User Profiles

### 6.1 Backend Implementation

✅ **Already implemented** in:
- `backend/src/routes/users.ts` - User profile routes

### 6.2 Frontend Implementation

✅ **Already implemented** in:
- `frontend/src/app/users/[username]/page.tsx` - User profile page

### 6.3 Test User Profiles

1. Visit `/users/{username}`
2. Verify profile displays correctly
3. Test follow/unfollow functionality

## Step 7: Watchlists

### 7.1 Backend Implementation

✅ **Already implemented** in:
- `backend/src/routes/watchlists.ts` - Watchlist routes

### 7.2 Frontend Implementation

✅ **Already implemented** in:
- `frontend/src/app/watchlist/page.tsx` - Watchlist page

### 7.3 Test Watchlists

1. Add show to watchlist from show page
2. Visit `/watchlist`
3. Verify shows appear
4. Test removal

## Step 8: Activity Feed

### 8.1 Backend Implementation

✅ **Already implemented** in:
- `backend/src/routes/feed.ts` - Feed route
- `backend/src/routes/social.ts` - Social features

### 8.2 Frontend Implementation

✅ **Already implemented** in:
- `frontend/src/app/feed/page.tsx` - Feed page

### 8.3 Test Activity Feed

1. Follow another user
2. Have that user log an episode
3. Visit `/feed`
4. Verify activity appears

## Step 9: Custom Lists

### 9.1 Backend Implementation

✅ **Already implemented** in:
- `backend/src/routes/lists.ts` - List routes

### 9.2 Frontend Implementation

**To be added**: List creation and management UI

## Step 10: Additional Features

### 10.1 Show Ratings

✅ **Already implemented** in:
- `backend/src/routes/ratings.ts` - Rating routes

### 10.2 Social Features

✅ **Already implemented**:
- Follow/unfollow users
- Like reviews
- Comment on reviews

## Testing Checklist

- [ ] User can register and login
- [ ] User can search for shows
- [ ] User can view show details
- [ ] User can view seasons and episodes
- [ ] User can log episodes with ratings
- [ ] User can add shows to watchlist
- [ ] User can view their watchlist
- [ ] User can follow other users
- [ ] User can view activity feed
- [ ] User can view profiles
- [ ] User can rate shows
- [ ] User can create custom lists

## Common Issues & Solutions

### Database Connection Error

**Issue**: Cannot connect to PostgreSQL

**Solution**:
1. Verify PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL in `.env`
3. Verify database exists: `psql -l | grep screend`

### Redis Connection Error

**Issue**: Cannot connect to Redis

**Solution**:
1. Verify Redis is running: `redis-cli ping`
2. Check REDIS_URL in `.env`
3. Start Redis: `redis-server`

### TMDb API Errors

**Issue**: TMDb API requests failing

**Solution**:
1. Verify TMDB_API_KEY is set in `.env`
2. Check API key is valid
3. Check rate limits (40 requests per 10 seconds)

### CORS Errors

**Issue**: CORS errors in browser

**Solution**:
1. Verify CORS_ORIGIN in backend `.env` matches frontend URL
2. Check frontend NEXT_PUBLIC_API_URL matches backend URL

## Next Steps After MVP

1. **Episode Logging UI**: Add UI to log episodes from show pages
2. **List Management UI**: Add UI for creating and managing lists
3. **Review Display**: Enhance review display with likes and comments
4. **Search Improvements**: Add filters and sorting
5. **Notifications**: Add notification system
6. **Statistics**: Add user statistics dashboard
7. **Recommendations**: Implement recommendation algorithm
8. **Mobile Responsiveness**: Ensure all pages are mobile-friendly
9. **Performance**: Add caching and optimization
10. **Testing**: Add unit and integration tests

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Backend (Railway/Render)

1. Push code to GitHub
2. Create new service
3. Set environment variables
4. Deploy

### Database

1. Use managed PostgreSQL service
2. Update DATABASE_URL
3. Run migrations

### Redis

1. Use managed Redis service
2. Update REDIS_URL

## Development Tips

1. **Use TypeScript**: Leverage type safety
2. **Check Logs**: Monitor console for errors
3. **Database Queries**: Use parameterized queries only
4. **Error Handling**: Always handle errors gracefully
5. **Validation**: Validate all user inputs
6. **Security**: Never expose secrets in code
7. **Performance**: Use indexes and caching
8. **Testing**: Test features as you build

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TMDb API Documentation](https://developers.themoviedb.org/3)
- [Redis Documentation](https://redis.io/docs/)
