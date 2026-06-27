import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: { message: 'Authentication required. Please provide a valid Bearer token.' } });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: { message: 'Authentication required. Token is missing.' } });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (error) {
    res.status(401).json({ error: { message: 'Invalid or expired token.' } });
    return;
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, email: decoded.email };
  } catch (error) {
    // Token is invalid but we don't fail — it's optional
  }

  next();
}
