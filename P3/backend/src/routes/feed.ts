import express, { Response } from 'express';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get activity feed
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    // Get activity from followed users
    const result = await query(
      `SELECT 
        el.id,
        el.user_id,
        el.episode_id,
        el.rating,
        el.review_text,
        el.watched_at,
        el.created_at,
        u.username,
        u.avatar_url,
        e.title as episode_title,
        e.episode_number,
        s.season_number,
        s.name as season_name,
        s.show_id,
        sh.title as show_title,
        sh.poster_url as show_poster,
        'episode_log' as activity_type
       FROM episode_logs el
       JOIN users u ON el.user_id = u.id
       JOIN episodes e ON el.episode_id = e.id
       JOIN seasons s ON e.season_id = s.id
       JOIN shows sh ON s.show_id = sh.id
       WHERE el.user_id IN (
         SELECT following_id FROM follows WHERE follower_id = $1
       )
       UNION ALL
       SELECT 
        w.id,
        w.user_id,
        NULL as episode_id,
        NULL as rating,
        NULL as review_text,
        w.created_at as watched_at,
        w.created_at,
        u.username,
        u.avatar_url,
        NULL as episode_title,
        NULL as episode_number,
        NULL as season_number,
        NULL as season_name,
        w.show_id,
        sh.title as show_title,
        sh.poster_url as show_poster,
        'watchlist_add' as activity_type
       FROM watchlists w
       JOIN users u ON w.user_id = u.id
       JOIN shows sh ON w.show_id = sh.id
       WHERE w.user_id IN (
         SELECT following_id FROM follows WHERE follower_id = $1
       )
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.userId, parseInt(limit as string), parseInt(offset as string)]
    );

    res.json({ activities: result.rows });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
