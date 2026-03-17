import express, { Response } from 'express';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Follow user
router.post('/follow/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const followingId = parseInt(req.params.userId);

    if (followingId === req.userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if user exists
    const userResult = await query('SELECT id FROM users WHERE id = $1', [followingId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Follow
    const result = await query(
      `INSERT INTO follows (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT (follower_id, following_id) DO NOTHING
       RETURNING *`,
      [req.userId, followingId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    res.status(201).json({ message: 'Followed successfully' });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unfollow user
router.post('/unfollow/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const followingId = parseInt(req.params.userId);

    const result = await query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2 RETURNING *',
      [req.userId, followingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not following this user' });
    }

    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Like review
router.post('/like/:reviewId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const reviewId = parseInt(req.params.reviewId);

    // Check if review exists
    const reviewResult = await query('SELECT id FROM episode_logs WHERE id = $1', [reviewId]);
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Like
    const result = await query(
      `INSERT INTO likes (user_id, review_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, review_id) DO NOTHING
       RETURNING *`,
      [req.userId, reviewId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Already liked this review' });
    }

    res.status(201).json({ message: 'Liked successfully' });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unlike review
router.post('/unlike/:reviewId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const reviewId = parseInt(req.params.reviewId);

    const result = await query(
      'DELETE FROM likes WHERE user_id = $1 AND review_id = $2 RETURNING *',
      [req.userId, reviewId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not liked' });
    }

    res.json({ message: 'Unliked successfully' });
  } catch (error) {
    console.error('Unlike error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Comment on review
router.post('/comment/:reviewId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const reviewId = parseInt(req.params.reviewId);
    const { comment_text } = req.body;

    if (!comment_text || typeof comment_text !== 'string' || comment_text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text required' });
    }

    // Check if review exists
    const reviewResult = await query('SELECT id FROM episode_logs WHERE id = $1', [reviewId]);
    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Create comment
    const result = await query(
      `INSERT INTO comments (user_id, review_id, comment_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.userId, reviewId, comment_text.trim()]
    );

    res.status(201).json({ comment: result.rows[0] });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comments for review
router.get('/comments/:reviewId', async (req: AuthRequest, res: Response) => {
  try {
    const reviewId = parseInt(req.params.reviewId);

    const result = await query(
      `SELECT c.*, u.id as user_id, u.username, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.review_id = $1
       ORDER BY c.created_at ASC`,
      [reviewId]
    );

    res.json({ comments: result.rows });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
