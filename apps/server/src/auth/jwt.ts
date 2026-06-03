import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

interface JwtPayload {
  sub: string;
  role: 'admin';
}

export async function verifyLogin(username: string, password: string): Promise<boolean> {
  if (username !== env.DASHBOARD_USERNAME) return false;

  if (env.DASHBOARD_PASSWORD.startsWith('$2')) {
    return bcrypt.compare(password, env.DASHBOARD_PASSWORD);
  }

  return password === env.DASHBOARD_PASSWORD;
}

export function signToken(username: string): string {
  const payload: JwtPayload = { sub: username, role: 'admin' };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '12h' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;

  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    jwt.verify(token, env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
}
