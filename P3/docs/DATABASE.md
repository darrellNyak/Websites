# Screend Database Schema

## Overview

The database uses PostgreSQL with a relational schema optimized for TV show tracking and social features.

## Tables

### users

Stores user account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing user ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | User's username |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| bio | TEXT | | User biography |
| avatar_url | VARCHAR(500) | | URL to user's avatar image |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `username` (unique)
- `email` (unique)

### shows

Stores TV show metadata synced from TMDb.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Internal show ID |
| tmdb_id | INTEGER | UNIQUE, NOT NULL | TMDb show ID |
| title | VARCHAR(255) | NOT NULL | Show title |
| description | TEXT | | Show description/overview |
| poster_url | VARCHAR(500) | | URL to poster image |
| backdrop_url | VARCHAR(500) | | URL to backdrop image |
| first_air_date | DATE | | First air date |
| last_air_date | DATE | | Last air date |
| network | VARCHAR(255) | | Network/channel |
| genres | TEXT[] | | Array of genre names |
| average_rating | DECIMAL(3,2) | | Average user rating |
| vote_count | INTEGER | DEFAULT 0 | Number of ratings |
| status | VARCHAR(50) | | Show status (e.g., "Returning Series", "Ended") |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `tmdb_id` (unique)
- `title` (for search)

### seasons

Stores season information for shows.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Season ID |
| show_id | INTEGER | NOT NULL, FK → shows.id | Parent show ID |
| season_number | INTEGER | NOT NULL | Season number (0 = specials) |
| name | VARCHAR(255) | | Season name |
| description | TEXT | | Season description |
| poster_url | VARCHAR(500) | | Season poster URL |
| air_date | DATE | | Season air date |
| episode_count | INTEGER | DEFAULT 0 | Number of episodes |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

**Indexes**:
- `(show_id, season_number)` (unique)
- `show_id` (for joins)

### episodes

Stores episode information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Episode ID |
| season_id | INTEGER | NOT NULL, FK → seasons.id | Parent season ID |
| episode_number | INTEGER | NOT NULL | Episode number |
| title | VARCHAR(255) | NOT NULL | Episode title |
| description | TEXT | | Episode description |
| runtime | INTEGER | | Runtime in minutes |
| air_date | DATE | | Air date |
| still_url | VARCHAR(500) | | Episode still image URL |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

**Indexes**:
- `(season_id, episode_number)` (unique)
- `season_id` (for joins)

### episode_logs

Stores user episode logs (watched, rated, reviewed).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Log ID |
| user_id | INTEGER | NOT NULL, FK → users.id | User ID |
| episode_id | INTEGER | NOT NULL, FK → episodes.id | Episode ID |
| rating | INTEGER | CHECK (1-5) | User rating (1-5 stars) |
| review_text | TEXT | | Review text |
| watched_at | TIMESTAMP | DEFAULT NOW() | Watch date/time |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `(user_id, episode_id)` (unique)
- `user_id` (for user activity queries)
- `episode_id` (for episode reviews)
- `watched_at DESC` (for feed queries)

### show_ratings

Stores overall show ratings from users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Rating ID |
| user_id | INTEGER | NOT NULL, FK → users.id | User ID |
| show_id | INTEGER | NOT NULL, FK → shows.id | Show ID |
| rating | INTEGER | CHECK (1-5) | Rating (1-5 stars) |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `(user_id, show_id)` (unique)
- `user_id` (for user ratings)
- `show_id` (for show statistics)

### watchlists

Stores user watchlists.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Watchlist item ID |
| user_id | INTEGER | NOT NULL, FK → users.id | User ID |
| show_id | INTEGER | NOT NULL, FK → shows.id | Show ID |
| created_at | TIMESTAMP | DEFAULT NOW() | Addition timestamp |

**Indexes**:
- `(user_id, show_id)` (unique)
- `user_id` (for user watchlist queries)

### lists

Stores custom lists created by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | List ID |
| user_id | INTEGER | NOT NULL, FK → users.id | Creator user ID |
| title | VARCHAR(255) | NOT NULL | List title |
| description | TEXT | | List description |
| is_public | BOOLEAN | DEFAULT true | Public visibility |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `user_id` (for user lists)

### list_items

Stores shows in custom lists.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Item ID |
| list_id | INTEGER | NOT NULL, FK → lists.id | List ID |
| show_id | INTEGER | NOT NULL, FK → shows.id | Show ID |
| created_at | TIMESTAMP | DEFAULT NOW() | Addition timestamp |

**Indexes**:
- `(list_id, show_id)` (unique)
- `list_id` (for list items)

### follows

Stores user follow relationships.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| follower_id | INTEGER | NOT NULL, FK → users.id | Follower user ID |
| following_id | INTEGER | NOT NULL, FK → users.id | Following user ID |
| created_at | TIMESTAMP | DEFAULT NOW() | Follow timestamp |

**Constraints**:
- PRIMARY KEY (follower_id, following_id)
- CHECK (follower_id != following_id)

**Indexes**:
- `follower_id` (for following list)
- `following_id` (for followers list)

### likes

Stores review likes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | INTEGER | NOT NULL, FK → users.id | User ID |
| review_id | INTEGER | NOT NULL, FK → episode_logs.id | Review ID |
| created_at | TIMESTAMP | DEFAULT NOW() | Like timestamp |

**Constraints**:
- PRIMARY KEY (user_id, review_id)

**Indexes**:
- `review_id` (for like counts)

### comments

Stores comments on reviews.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Comment ID |
| user_id | INTEGER | NOT NULL, FK → users.id | Commenter user ID |
| review_id | INTEGER | NOT NULL, FK → episode_logs.id | Review ID |
| comment_text | TEXT | NOT NULL | Comment text |
| created_at | TIMESTAMP | DEFAULT NOW() | Comment timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `review_id` (for review comments)

## Relationships

```
users
  ├── episode_logs (1:N)
  ├── show_ratings (1:N)
  ├── watchlists (1:N)
  ├── lists (1:N)
  ├── follows (N:M via follows table)
  ├── likes (N:M via likes table)
  └── comments (1:N)

shows
  ├── seasons (1:N)
  ├── show_ratings (1:N)
  ├── watchlists (1:N)
  └── list_items (1:N)

seasons
  └── episodes (1:N)

episodes
  ├── episode_logs (1:N)
  └── comments (via episode_logs)

episode_logs
  ├── likes (1:N)
  └── comments (1:N)
```

## Common Queries

### User Activity Feed

```sql
SELECT 
  el.*, u.username, e.title as episode_title,
  s.season_number, sh.title as show_title
FROM episode_logs el
JOIN users u ON el.user_id = u.id
JOIN episodes e ON el.episode_id = e.id
JOIN seasons s ON e.season_id = s.id
JOIN shows sh ON s.show_id = sh.id
WHERE el.user_id IN (
  SELECT following_id FROM follows WHERE follower_id = $1
)
ORDER BY el.watched_at DESC
LIMIT 50;
```

### Show Statistics

```sql
SELECT 
  COUNT(DISTINCT el.user_id) as watchers,
  COUNT(el.id) as total_logs,
  AVG(el.rating) as avg_episode_rating,
  AVG(sr.rating) as avg_show_rating
FROM shows s
LEFT JOIN seasons se ON s.id = se.show_id
LEFT JOIN episodes e ON se.id = e.season_id
LEFT JOIN episode_logs el ON e.id = el.episode_id
LEFT JOIN show_ratings sr ON s.id = sr.show_id
WHERE s.id = $1
GROUP BY s.id;
```

### User Statistics

```sql
SELECT 
  COUNT(DISTINCT el.episode_id) as episodes_watched,
  COUNT(DISTINCT s.id) as shows_watched,
  AVG(el.rating) as avg_rating,
  SUM(e.runtime) as total_minutes_watched
FROM users u
LEFT JOIN episode_logs el ON u.id = el.user_id
LEFT JOIN episodes e ON el.episode_id = e.id
LEFT JOIN seasons se ON e.season_id = se.id
LEFT JOIN shows s ON se.show_id = s.id
WHERE u.id = $1;
```

## Migration Script

The database schema is created via SQL migration script located at:
`backend/src/db/schema.sql`

Run migrations:
```bash
cd backend
npm run migrate
```

## Future Enhancements

- Full-text search indexes on show titles and descriptions
- Materialized views for trending calculations
- Partitioning for large tables (episode_logs)
- Read replicas for read-heavy queries
- Archive tables for old data
