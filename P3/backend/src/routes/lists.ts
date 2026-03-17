import express, { Response } from 'express';
import { query } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const createListSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  is_public: z.boolean().optional().default(true),
});

// Get user's lists
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT l.*, COUNT(li.id) as item_count
       FROM lists l
       LEFT JOIN list_items li ON l.id = li.list_id
       WHERE l.user_id = $1
       GROUP BY l.id
       ORDER BY l.created_at DESC`,
      [req.userId]
    );

    res.json({ lists: result.rows });
  } catch (error) {
    console.error('Get lists error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get list by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const listId = parseInt(req.params.id);

    const listResult = await query(
      `SELECT l.*, u.id as user_id, u.username, u.avatar_url
       FROM lists l
       JOIN users u ON l.user_id = u.id
       WHERE l.id = $1`,
      [listId]
    );

    if (listResult.rows.length === 0) {
      return res.status(404).json({ error: 'List not found' });
    }

    const list = listResult.rows[0];

    // Get list items
    const itemsResult = await query(
      `SELECT li.*, s.id as show_id, s.tmdb_id, s.title, s.poster_url, s.description
       FROM list_items li
       JOIN shows s ON li.show_id = s.id
       WHERE li.list_id = $1
       ORDER BY li.created_at ASC`,
      [listId]
    );

    res.json({
      list,
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error('Get list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create list
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, is_public } = createListSchema.parse(req.body);

    const result = await query(
      `INSERT INTO lists (user_id, title, description, is_public)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.userId, title, description || null, is_public ?? true]
    );

    res.status(201).json({ list: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add show to list
router.post('/:id/add', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const listId = parseInt(req.params.id);
    const { show_id } = req.body;

    if (!show_id) {
      return res.status(400).json({ error: 'show_id required' });
    }

    // Verify list ownership
    const listResult = await query('SELECT user_id FROM lists WHERE id = $1', [listId]);
    if (listResult.rows.length === 0) {
      return res.status(404).json({ error: 'List not found' });
    }
    if (listResult.rows[0].user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Add show
    const result = await query(
      `INSERT INTO list_items (list_id, show_id)
       VALUES ($1, $2)
       ON CONFLICT (list_id, show_id) DO NOTHING
       RETURNING *`,
      [listId, show_id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Show already in list' });
    }

    res.status(201).json({ item: result.rows[0] });
  } catch (error) {
    console.error('Add to list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove show from list
router.delete('/:id/remove/:showId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const listId = parseInt(req.params.id);
    const showId = parseInt(req.params.showId);

    // Verify list ownership
    const listResult = await query('SELECT user_id FROM lists WHERE id = $1', [listId]);
    if (listResult.rows.length === 0) {
      return res.status(404).json({ error: 'List not found' });
    }
    if (listResult.rows[0].user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await query(
      'DELETE FROM list_items WHERE list_id = $1 AND show_id = $2 RETURNING id',
      [listId, showId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Show not in list' });
    }

    res.json({ message: 'Removed from list' });
  } catch (error) {
    console.error('Remove from list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
