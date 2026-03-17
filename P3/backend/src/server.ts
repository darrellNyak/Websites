import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Routes
import authRoutes from './routes/auth';
import showsRoutes from './routes/shows';
import episodesRoutes from './routes/episodes';
import watchlistsRoutes from './routes/watchlists';
import listsRoutes from './routes/lists';
import socialRoutes from './routes/social';
import feedRoutes from './routes/feed';
import usersRoutes from './routes/users';
import ratingsRoutes from './routes/ratings';

// Database connection
import './db';
import './config/redis';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shows', showsRoutes);
app.use('/api/episodes', episodesRoutes);
app.use('/api/watchlists', watchlistsRoutes);
app.use('/api/lists', listsRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ratings', ratingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
