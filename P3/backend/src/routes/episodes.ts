import express, { Response } from 'express';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const logEpisodeSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  review_text: z.string().optional(),
  watched_at: z.string().optional(),
});

// Log episode (mark as watched, rate, review)
router.post('/:id/log', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const episodeId = parseInt(req.params.id);
    const { rating, review_text, watched_at } = logEpisodeSchema.parse(req.body);

    // Check if episode exists
    const episodeResult = await query('SELECT id FROM episodes WHERE id = $1', [episodeId]);
    if (episodeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    // Insert or update log
    const result = await query(
      `INSERT INTO episode_logs (user_id, episode_id, rating, review_text, watched_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, episode_id) DO UPDATE SET
         rating = EXCLUDED.rating,
         review_text = EXCLUDED.review_text,
         watched_at = EXCLUDED.watched_at,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        req.userId,
        episodeId,
        rating || null,
        review_text || null,
        watched_at ? new Date(watched_at) : new Date(),
      ]
    );

    res.json({ log: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Log episode error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get episode details
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const episodeId = parseInt(req.params.id);

    const result = await query(
      `SELECT e.*, s.season_number, s.show_id, s.name as season_name
       FROM episodes e
       JOIN seasons s ON e.season_id = s.id
       WHERE e.id = $1`,
      [episodeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    const episode = result.rows[0];

    // Get user log
    const logResult = await query(
      'SELECT * FROM episode_logs WHERE user_id = $1 AND episode_id = $2',
      [req.userId, episodeId]
    );

    // Get reviews (logs with review_text)
    const reviewsResult = await query(
      `SELECT el.*, u.id as user_id, u.username, u.avatar_url
       FROM episode_logs el
       JOIN users u ON el.user_id = u.id
       WHERE el.episode_id = $1 AND el.review_text IS NOT NULL
       ORDER BY el.created_at DESC
       LIMIT 20`,
      [episodeId]
    );

    // Get like counts for reviews
    const reviews = await Promise.all(
      reviewsResult.rows.map(async (review) => {
        const likesResult = await query(
          'SELECT COUNT(*) as count FROM likes WHERE review_id = $1',
          [review.id]
        );
        const userLikedResult = await query(
          'SELECT 1 FROM likes WHERE user_id = $1 AND review_id = $2',
          [req.userId, review.id]
        );

        return {
          ...review,
          likes_count: parseInt(likesResult.rows[0]?.count || '0'),
          user_liked: userLikedResult.rows.length > 0,
        };
      })
    );

    res.json({
      episode: {
        ...episode,
        user_log: logResult.rows[0] || null,
      },
      reviews,
    });
  } catch (error) {
    console.error('Get episode error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete episode log
router.delete('/:id/log', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const episodeId = parseInt(req.params.id);

    const result = await query(
      'DELETE FROM episode_logs WHERE user_id = $1 AND episode_id = $2 RETURNING id',
      [req.userId, episodeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Log not found' });
    }

    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    console.error('Delete log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
