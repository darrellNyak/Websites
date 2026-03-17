import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';

export interface AuthRequest extends Request {
  userId?: number;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };

    // Fetch user from database
    const result = await query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.userId = decoded.userId;
    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
      const result = await query(
        'SELECT id, username, email FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length > 0) {
        req.userId = decoded.userId;
        req.user = result.rows[0];
      }
    }
    next();
  } catch (error) {
    next();
  }
};
