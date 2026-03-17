import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { tmdbRoutes } from './routes/tmdb.js';
import { wikipediaRoutes } from './routes/wikipedia.js';

// Always load the backend-local .env regardless of where the command is run from
dotenv.config({ path: new URL('.env', import.meta.url) });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/wikipedia', wikipediaRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend API is running',
    hasTmdbKey: Boolean(process.env.TMDB_API_KEY),
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
