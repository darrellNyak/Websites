import express, { Response } from 'express';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const rateShowSchema = z.object({
  rating: z.number().min(1).max(5),
});

// Rate a show
router.post('/shows/:showId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const showId = parseInt(req.params.showId);
    const { rating } = rateShowSchema.parse(req.body);

    // Check if show exists
    const showResult = await query('SELECT id FROM shows WHERE id = $1', [showId]);
    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: 'Show not found' });
    }

    // Insert or update rating
    const result = await query(
      `INSERT INTO show_ratings (user_id, show_id, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, show_id) DO UPDATE SET
         rating = EXCLUDED.rating,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.userId, showId, rating]
    );

    res.json({ rating: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Rate show error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get show ratings
router.get('/shows/:showId', async (req: AuthRequest, res: Response) => {
  try {
    const showId = parseInt(req.params.showId);

    const result = await query(
      `SELECT AVG(rating) as average_rating, COUNT(*) as rating_count
       FROM show_ratings
       WHERE show_id = $1`,
      [showId]
    );

    res.json({
      average_rating: result.rows[0]?.average_rating || null,
      rating_count: parseInt(result.rows[0]?.rating_count || '0'),
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
