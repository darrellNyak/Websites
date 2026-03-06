import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { tmdbRoutes } from './routes/tmdb.js';
import { wikipediaRoutes } from './routes/wikipedia.js';

dotenv.config();

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
  res.json({ status: 'ok', message: 'Backend API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
