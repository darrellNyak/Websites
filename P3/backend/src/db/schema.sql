-- Screend Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shows table
CREATE TABLE IF NOT EXISTS shows (
    id SERIAL PRIMARY KEY,
    tmdb_id INTEGER UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    poster_url VARCHAR(500),
    backdrop_url VARCHAR(500),
    first_air_date DATE,
    last_air_date DATE,
    network VARCHAR(255),
    genres TEXT[], -- Array of genre strings
    average_rating DECIMAL(3,2),
    vote_count INTEGER DEFAULT 0,
    status VARCHAR(50), -- 'Returning Series', 'Ended', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seasons table
CREATE TABLE IF NOT EXISTS seasons (
    id SERIAL PRIMARY KEY,
    show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    name VARCHAR(255),
    description TEXT,
    poster_url VARCHAR(500),
    air_date DATE,
    episode_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(show_id, season_number)
);

-- Episodes table
CREATE TABLE IF NOT EXISTS episodes (
    id SERIAL PRIMARY KEY,
    season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    runtime INTEGER, -- in minutes
    air_date DATE,
    still_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(season_id, episode_number)
);

-- Episode Logs (when user watches/rates an episode)
CREATE TABLE IF NOT EXISTS episode_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    episode_id INTEGER NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, episode_id)
);

-- Show Ratings (overall show rating)
CREATE TABLE IF NOT EXISTS show_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, show_id)
);

-- Watchlists
CREATE TABLE IF NOT EXISTS watchlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, show_id)
);

-- Custom Lists
CREATE TABLE IF NOT EXISTS lists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- List Items
CREATE TABLE IF NOT EXISTS list_items (
    id SERIAL PRIMARY KEY,
    list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(list_id, show_id)
);

-- Follows (user follows another user)
CREATE TABLE IF NOT EXISTS follows (
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Likes (user likes a review)
CREATE TABLE IF NOT EXISTS likes (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_id INTEGER NOT NULL REFERENCES episode_logs(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, review_id)
);

-- Comments (comments on reviews)
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_id INTEGER NOT NULL REFERENCES episode_logs(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shows_tmdb_id ON shows(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_shows_title ON shows(title);
CREATE INDEX IF NOT EXISTS idx_seasons_show_id ON seasons(show_id);
CREATE INDEX IF NOT EXISTS idx_episodes_season_id ON episodes(season_id);
CREATE INDEX IF NOT EXISTS idx_episode_logs_user_id ON episode_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_episode_logs_episode_id ON episode_logs(episode_id);
CREATE INDEX IF NOT EXISTS idx_episode_logs_watched_at ON episode_logs(watched_at DESC);
CREATE INDEX IF NOT EXISTS idx_show_ratings_user_id ON show_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_show_ratings_show_id ON show_ratings(show_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_likes_review_id ON likes(review_id);
CREATE INDEX IF NOT EXISTS idx_comments_review_id ON comments(review_id);
