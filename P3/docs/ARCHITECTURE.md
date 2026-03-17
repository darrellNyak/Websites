# Screend System Architecture

## Overview

Screend is a full-stack TV show tracking platform built with a modern, scalable architecture. The system is designed to handle millions of users while maintaining fast response times and high availability.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Next.js Frontend (Vercel)                    │   │
│  │  - React Components                                  │   │
│  │  - Server-Side Rendering                            │   │
│  │  - Static Generation                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      Express.js API Server (Railway/Render)         │   │
│  │  - Authentication Middleware                         │   │
│  │  - Rate Limiting                                     │   │
│  │  - Request Validation                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │    Redis     │   │  TMDb API    │
│  Database    │   │    Cache     │   │  External    │
│              │   │              │   │              │
│  - Users     │   │  - Sessions  │   │  - Show Data │
│  - Shows     │   │  - API Cache │   │  - Images    │
│  - Logs      │   │  - Rate Limit│   │              │
│  - Social    │   │              │   │              │
└──────────────┘   ┌──────────────┘   ┌──────────────┘
                   │                  │
                   └──────────────────┘
                   │
                   ▼
            ┌──────────────┐
            │   AWS S3     │
            │  (Optional)  │
            │  - Avatars   │
            │  - Uploads   │
            └──────────────┘
```

## Component Details

### Frontend (Next.js)

**Location**: `frontend/`

**Technology Stack**:
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS

**Key Features**:
- Server-Side Rendering (SSR) for SEO
- Static Site Generation (SSG) for performance
- Client-Side Navigation
- API Integration Layer
- Authentication State Management

**Pages**:
- `/` - Home page with trending shows
- `/login` - User authentication
- `/register` - User registration
- `/discover` - Show discovery and search
- `/shows/[id]` - Show details page
- `/feed` - Activity feed
- `/watchlist` - User watchlist
- `/users/[username]` - User profiles

### Backend (Express.js)

**Location**: `backend/`

**Technology Stack**:
- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Redis

**API Routes**:
- `/api/auth/*` - Authentication endpoints
- `/api/shows/*` - Show data endpoints
- `/api/episodes/*` - Episode logging
- `/api/watchlists/*` - Watchlist management
- `/api/lists/*` - Custom lists
- `/api/social/*` - Social features (follow, like, comment)
- `/api/feed/*` - Activity feed
- `/api/users/*` - User profiles
- `/api/ratings/*` - Show ratings

**Middleware**:
- Authentication (JWT)
- Rate Limiting
- CORS
- Error Handling
- Request Validation

### Database (PostgreSQL)

**Schema**: See `docs/DATABASE.md`

**Key Tables**:
- `users` - User accounts
- `shows` - TV show metadata
- `seasons` - Season information
- `episodes` - Episode information
- `episode_logs` - User episode logs/reviews
- `show_ratings` - Overall show ratings
- `watchlists` - User watchlists
- `lists` - Custom lists
- `follows` - User follow relationships
- `likes` - Review likes
- `comments` - Review comments

**Indexes**:
- Optimized for common queries (user_id, show_id, watched_at, etc.)
- Composite indexes for join queries
- Full-text search indexes (future)

### Caching (Redis)

**Use Cases**:
- Session storage
- API response caching
- Rate limiting counters
- Trending show calculations
- User feed caching

**Cache Keys**:
- `show:{id}` - Show details (TTL: 1 hour)
- `trending:shows` - Trending shows (TTL: 6 hours)
- `user:{id}:feed` - User activity feed (TTL: 5 minutes)
- `session:{token}` - User sessions

### External Services

**TMDb API**:
- TV show metadata
- Images (posters, backdrops)
- Search functionality
- Trending shows

**AWS S3** (Optional):
- User avatar storage
- Custom image uploads

## Data Flow

### Show Discovery Flow

1. User searches for show on frontend
2. Frontend sends request to `/api/shows/search`
3. Backend queries TMDb API
4. Results cached in Redis
5. Response sent to frontend
6. Frontend displays results

### Episode Logging Flow

1. User logs episode on frontend
2. Frontend sends POST to `/api/episodes/:id/log`
3. Backend validates authentication
4. Database transaction:
   - Insert/update episode_log
   - Update show statistics
5. Invalidate relevant caches
6. Response sent to frontend
7. Activity added to feed

### Activity Feed Flow

1. User requests feed
2. Backend checks Redis cache
3. If cache miss:
   - Query database for followed users' activity
   - Cache result
4. Return feed to frontend
5. Frontend renders activities

## Security

- **Authentication**: JWT tokens stored in httpOnly cookies
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Per-IP and per-user limits
- **CORS**: Configured for specific origins
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection**: Parameterized queries only
- **XSS Protection**: Helmet.js security headers

## Scalability Considerations

### Horizontal Scaling

- **Stateless API**: All servers can handle any request
- **Database Connection Pooling**: Efficient connection management
- **Redis for Sessions**: Shared session storage
- **Load Balancing**: Multiple API servers behind load balancer

### Performance Optimization

- **Database Indexes**: Optimized for common queries
- **Redis Caching**: Frequently accessed data cached
- **CDN**: Static assets served via CDN
- **Image Optimization**: Next.js Image component
- **Pagination**: All list endpoints paginated

### Future Enhancements

- **Read Replicas**: PostgreSQL read replicas for read-heavy queries
- **Message Queue**: RabbitMQ/Kafka for async tasks
- **Search Engine**: Elasticsearch for advanced search
- **Microservices**: Split into smaller services as needed
- **GraphQL**: Consider GraphQL for flexible queries

## Deployment

### Frontend (Vercel)

- Automatic deployments from Git
- Edge network for global CDN
- Serverless functions for API routes
- Environment variables configured in dashboard

### Backend (Railway/Render)

- Docker container deployment
- Environment variables from dashboard
- Auto-scaling based on traffic
- Health check endpoints

### Database (PostgreSQL)

- Managed database service (Railway/Render)
- Automated backups
- Connection pooling
- Read replicas for production

### Redis

- Managed Redis service
- High availability setup
- Persistence configured
- Memory optimization

## Monitoring & Logging

- **Application Logs**: Structured logging with Winston
- **Error Tracking**: Sentry integration (future)
- **Performance Monitoring**: New Relic/DataDog (future)
- **Database Monitoring**: Query performance tracking
- **Uptime Monitoring**: Health check endpoints

## Development Workflow

1. Local development with Docker Compose
2. Feature branches in Git
3. Automated testing (future)
4. Code review process
5. Staging environment for testing
6. Production deployment after approval
