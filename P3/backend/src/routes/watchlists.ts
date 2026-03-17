import express, { Response } from 'express';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get user's watchlist
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT w.*, s.id as show_id, s.tmdb_id, s.title, s.poster_url, s.description
       FROM watchlists w
       JOIN shows s ON w.show_id = s.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.userId]
    );

    res.json({ watchlist: result.rows });
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to watchlist
router.post('/:showId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const showId = parseInt(req.params.showId);

    // Check if show exists
    const showResult = await query('SELECT id FROM shows WHERE id = $1', [showId]);
    if (showResult.rows.length === 0) {
      return res.status(404).json({ error: 'Show not found' });
    }

    // Add to watchlist
    const result = await query(
      `INSERT INTO watchlists (user_id, show_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, show_id) DO NOTHING
       RETURNING *`,
      [req.userId, showId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Show already in watchlist' });
    }

    res.status(201).json({ watchlist_item: result.rows[0] });
  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove from watchlist
router.delete('/:showId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const showId = parseInt(req.params.showId);

    const result = await query(
      'DELETE FROM watchlists WHERE user_id = $1 AND show_id = $2 RETURNING id',
      [req.userId, showId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Show not in watchlist' });
    }

    res.json({ message: 'Removed from watchlist' });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
