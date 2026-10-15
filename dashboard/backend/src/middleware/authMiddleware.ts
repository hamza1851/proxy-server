import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface AuthRequest extends Request {
  user?: {
    username: string;
    role: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  // Public paths
  if (
    req.path === '/auth/login' ||
    req.path === '/blocked' ||
    req.path.startsWith('/assets') ||
    req.path === '/'
  ) {
    next();
    return;
  }

  const authHeader = req.headers.authorization || (req.headers['x-access-token'] as string);
  if (!authHeader) {
    res.status(401).json({ error: 'Access Denied: Missing Operator Authentication Token' });
    return;
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { username: string; role: string };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Access Denied: Invalid or Expired Token' });
  }
}
