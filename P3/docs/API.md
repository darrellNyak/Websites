# Screend API Documentation

Base URL: `http://localhost:5000/api` (development) or `https://api.screend.com/api` (production)

## Authentication

Most endpoints require authentication via JWT token. Include the token in:
- Cookie: `token` (preferred)
- Header: `Authorization: Bearer <token>`

## Endpoints

### Authentication

#### POST `/auth/register`

Register a new user.

**Request Body**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response** (201):
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  },
  "token": "jwt_token_here"
}
```

#### POST `/auth/login`

Login user.

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  },
  "token": "jwt_token_here"
}
```

#### POST `/auth/logout`

Logout user (clears cookie).

**Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

#### GET `/auth/me`

Get current authenticated user.

**Response** (200):
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "bio": "TV show enthusiast",
    "avatar_url": "https://...",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Shows

#### GET `/shows/search?q=query&page=1`

Search for TV shows.

**Query Parameters**:
- `q` (required): Search query
- `page` (optional): Page number (default: 1)

**Response** (200):
```json
{
  "results": [
    {
      "tmdb_id": 1396,
      "title": "Breaking Bad",
      "description": "A high school chemistry teacher...",
      "poster_url": "https://...",
      "backdrop_url": "https://...",
      "first_air_date": "2008-01-20",
      "average_rating": 8.9,
      "vote_count": 5000
    }
  ],
  "page": 1,
  "total_pages": 10,
  "total_results": 200
}
```

#### GET `/shows/:id`

Get show details by ID (can be internal ID or TMDB ID).

**Response** (200):
```json
{
  "id": 1,
  "tmdb_id": 1396,
  "title": "Breaking Bad",
  "description": "...",
  "poster_url": "https://...",
  "backdrop_url": "https://...",
  "first_air_date": "2008-01-20",
  "network": "AMC",
  "genres": ["Drama", "Crime"],
  "average_rating": 4.5,
  "rating_count": 100,
  "user_rating": 5
}
```

#### GET `/shows/:id/seasons`

Get all seasons for a show.

**Response** (200):
```json
{
  "seasons": [
    {
      "id": 1,
      "show_id": 1,
      "season_number": 1,
      "name": "Season 1",
      "episode_count": 7,
      "watched_count": 6
    }
  ]
}
```

#### GET `/shows/:id/seasons/:seasonNumber/episodes`

Get all episodes for a season.

**Response** (200):
```json
{
  "episodes": [
    {
      "id": 1,
      "season_id": 1,
      "episode_number": 1,
      "title": "Pilot",
      "description": "...",
      "runtime": 58,
      "air_date": "2008-01-20",
      "user_log": {
        "id": 1,
        "rating": 5,
        "review_text": "Amazing pilot!",
        "watched_at": "2024-01-01T00:00:00Z"
      }
    }
  ]
}
```

#### GET `/shows/trending?time_window=week`

Get trending shows.

**Query Parameters**:
- `time_window` (optional): "day" or "week" (default: "week")

**Response** (200):
```json
{
  "results": [
    {
      "tmdb_id": 1396,
      "title": "Breaking Bad",
      "description": "...",
      "poster_url": "https://...",
      "average_rating": 8.9
    }
  ]
}
```

### Episodes

#### POST `/episodes/:id/log`

Log an episode (mark as watched, rate, review).

**Request Body**:
```json
{
  "rating": 5,
  "review_text": "Amazing episode!",
  "watched_at": "2024-01-01T00:00:00Z"
}
```

**Response** (200):
```json
{
  "log": {
    "id": 1,
    "user_id": 1,
    "episode_id": 1,
    "rating": 5,
    "review_text": "Amazing episode!",
    "watched_at": "2024-01-01T00:00:00Z"
  }
}
```

#### GET `/episodes/:id`

Get episode details with reviews.

**Response** (200):
```json
{
  "episode": {
    "id": 1,
    "season_id": 1,
    "episode_number": 1,
    "title": "Pilot",
    "description": "...",
    "runtime": 58,
    "user_log": {
      "id": 1,
      "rating": 5,
      "review_text": "Amazing!",
      "watched_at": "2024-01-01T00:00:00Z"
    }
  },
  "reviews": [
    {
      "id": 1,
      "user_id": 1,
      "username": "johndoe",
      "rating": 5,
      "review_text": "Amazing!",
      "likes_count": 10,
      "user_liked": false
    }
  ]
}
```

#### DELETE `/episodes/:id/log`

Delete episode log.

**Response** (200):
```json
{
  "message": "Log deleted successfully"
}
```

### Watchlists

#### GET `/watchlists`

Get user's watchlist.

**Response** (200):
```json
{
  "watchlist": [
    {
      "id": 1,
      "show_id": 1,
      "title": "Breaking Bad",
      "poster_url": "https://...",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST `/watchlists/:showId`

Add show to watchlist.

**Response** (201):
```json
{
  "watchlist_item": {
    "id": 1,
    "user_id": 1,
    "show_id": 1,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### DELETE `/watchlists/:showId`

Remove show from watchlist.

**Response** (200):
```json
{
  "message": "Removed from watchlist"
}
```

### Lists

#### GET `/lists`

Get user's custom lists.

**Response** (200):
```json
{
  "lists": [
    {
      "id": 1,
      "user_id": 1,
      "title": "Best Sitcoms",
      "description": "My favorite sitcoms",
      "is_public": true,
      "item_count": 10,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET `/lists/:id`

Get list details with items.

**Response** (200):
```json
{
  "list": {
    "id": 1,
    "user_id": 1,
    "username": "johndoe",
    "title": "Best Sitcoms",
    "description": "...",
    "is_public": true
  },
  "items": [
    {
      "id": 1,
      "show_id": 1,
      "title": "The Office",
      "poster_url": "https://...",
      "description": "..."
    }
  ]
}
```

#### POST `/lists`

Create a new list.

**Request Body**:
```json
{
  "title": "Best Sitcoms",
  "description": "My favorite sitcoms",
  "is_public": true
}
```

**Response** (201):
```json
{
  "list": {
    "id": 1,
    "user_id": 1,
    "title": "Best Sitcoms",
    "description": "...",
    "is_public": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### POST `/lists/:id/add`

Add show to list.

**Request Body**:
```json
{
  "show_id": 1
}
```

**Response** (201):
```json
{
  "item": {
    "id": 1,
    "list_id": 1,
    "show_id": 1,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### DELETE `/lists/:id/remove/:showId`

Remove show from list.

**Response** (200):
```json
{
  "message": "Removed from list"
}
```

### Social

#### POST `/social/follow/:userId`

Follow a user.

**Response** (201):
```json
{
  "message": "Followed successfully"
}
```

#### POST `/social/unfollow/:userId`

Unfollow a user.

**Response** (200):
```json
{
  "message": "Unfollowed successfully"
}
```

#### POST `/social/like/:reviewId`

Like a review.

**Response** (201):
```json
{
  "message": "Liked successfully"
}
```

#### POST `/social/unlike/:reviewId`

Unlike a review.

**Response** (200):
```json
{
  "message": "Unliked successfully"
}
```

#### POST `/social/comment/:reviewId`

Comment on a review.

**Request Body**:
```json
{
  "comment_text": "Great review!"
}
```

**Response** (201):
```json
{
  "comment": {
    "id": 1,
    "user_id": 1,
    "review_id": 1,
    "comment_text": "Great review!",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### GET `/social/comments/:reviewId`

Get comments for a review.

**Response** (200):
```json
{
  "comments": [
    {
      "id": 1,
      "user_id": 1,
      "username": "johndoe",
      "avatar_url": "https://...",
      "comment_text": "Great review!",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Feed

#### GET `/feed?limit=50&offset=0`

Get activity feed from followed users.

**Query Parameters**:
- `limit` (optional): Number of activities (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response** (200):
```json
{
  "activities": [
    {
      "id": 1,
      "user_id": 2,
      "username": "janedoe",
      "activity_type": "episode_log",
      "episode_id": 1,
      "episode_title": "Pilot",
      "season_number": 1,
      "episode_number": 1,
      "show_id": 1,
      "show_title": "Breaking Bad",
      "show_poster": "https://...",
      "rating": 5,
      "review_text": "Amazing!",
      "watched_at": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Users

#### GET `/users/:username`

Get user profile.

**Response** (200):
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "bio": "TV show enthusiast",
    "avatar_url": "https://...",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "stats": {
    "episodes_watched": 500,
    "shows_rated": 50,
    "watchlist_count": 20,
    "following_count": 10,
    "followers_count": 25
  },
  "recent_activity": [
    {
      "id": 1,
      "episode_id": 1,
      "episode_title": "Pilot",
      "season_number": 1,
      "episode_number": 1,
      "show_id": 1,
      "show_title": "Breaking Bad",
      "rating": 5,
      "review_text": "Amazing!",
      "watched_at": "2024-01-01T00:00:00Z"
    }
  ],
  "is_following": false
}
```

#### PUT `/users/profile`

Update user profile.

**Request Body**:
```json
{
  "bio": "Updated bio",
  "avatar_url": "https://..."
}
```

**Response** (200):
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "bio": "Updated bio",
    "avatar_url": "https://...",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Ratings

#### POST `/ratings/shows/:showId`

Rate a show.

**Request Body**:
```json
{
  "rating": 5
}
```

**Response** (200):
```json
{
  "rating": {
    "id": 1,
    "user_id": 1,
    "show_id": 1,
    "rating": 5,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### GET `/ratings/shows/:showId`

Get show ratings summary.

**Response** (200):
```json
{
  "average_rating": 4.5,
  "rating_count": 100
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message here"
}
```

**Status Codes**:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Authentication endpoints: 10 requests per 15 minutes per IP
- Search endpoints: 50 requests per 15 minutes per IP

Rate limit headers included in responses:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)
