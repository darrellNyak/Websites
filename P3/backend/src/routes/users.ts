import express, { Response } from 'express';
import { query } from '../db';
import { authenticate, AuthRequest, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Get user profile
router.get('/:username', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;

    const userResult = await query(
      'SELECT id, username, email, bio, avatar_url, created_at FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get stats
    const statsResult = await query(
      `SELECT 
        (SELECT COUNT(*) FROM episode_logs WHERE user_id = $1) as episodes_watched,
        (SELECT COUNT(*) FROM shows s JOIN show_ratings sr ON s.id = sr.show_id WHERE sr.user_id = $1) as shows_rated,
        (SELECT COUNT(*) FROM watchlists WHERE user_id = $1) as watchlist_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = $1) as following_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = $1) as followers_count`,
      [user.id]
    );

    // Get recent activity
    const activityResult = await query(
      `SELECT el.*, e.title as episode_title, e.episode_number,
        s.season_number, s.name as season_name, s.show_id,
        sh.title as show_title, sh.poster_url as show_poster
       FROM episode_logs el
       JOIN episodes e ON el.episode_id = e.id
       JOIN seasons s ON e.season_id = s.id
       JOIN shows sh ON s.show_id = sh.id
       WHERE el.user_id = $1
       ORDER BY el.watched_at DESC
       LIMIT 10`,
      [user.id]
    );

    // Check if current user is following
    let is_following = false;
    if (req.userId && req.userId !== user.id) {
      const followResult = await query(
        'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
        [req.userId, user.id]
      );
      is_following = followResult.rows.length > 0;
    }

    res.json({
      user: {
        ...user,
        email: req.userId === user.id ? user.email : undefined, // Only show email to self
      },
      stats: statsResult.rows[0],
      recent_activity: activityResult.rows,
      is_following,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { bio, avatar_url } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(bio);
    }

    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramCount++}`);
      values.push(avatar_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.userId);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, username, email, bio, avatar_url, created_at`,
      values
    );

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
