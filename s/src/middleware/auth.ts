import '../config/env.ts';
import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';
import { db } from '../db/index.ts';
import { getOrCreateFirebaseUser } from '../db/repository.ts';
import { users } from '../db/schema.ts';
import { adminAuth } from '../lib/firebase-admin.ts';

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  (process.env.NODE_ENV === 'production'
    ? ''
    : 'alhamd-store-dev-only-secret-change-me');

if (!SESSION_SECRET) {
  throw new Error(
    'SESSION_SECRET must be set in production (add it to .env.local or your host env vars).'
  );
}

export interface DbUser {
  id: number;
  uid: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
}

export interface AuthRequest extends Request {
  dbUser?: DbUser;
}

export function signSessionToken(payload: {
  id: number;
  uid: string;
  email: string;
  role: string;
}): string {
  const data = {
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `local.${encoded}.${sig}`;
}

export function verifySessionToken(
  token: string
): { id: number; uid: string; email: string; role: string; exp: number } | null {
  if (!token.startsWith('local.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, encoded, sig] = parts;
  const expected = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function resolveUserFromToken(token: string): Promise<DbUser | null> {
  const local = verifySessionToken(token);
  if (local) {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, local.id))
      .limit(1);
    const u = rows[0];
    if (!u || !u.isActive) return null;
    return {
      id: u.id,
      uid: u.uid,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
    };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userRow = await getOrCreateFirebaseUser(
      decoded.uid,
      decoded.email || `${decoded.uid}@firebase.local`,
      decoded.name || decoded.email?.split('@')[0] || 'مستخدم'
    );
    if (!userRow.isActive) return null;
    return {
      id: userRow.id,
      uid: userRow.uid,
      name: userRow.name,
      email: userRow.email,
      phone: userRow.phone,
      role: userRow.role,
      isActive: userRow.isActive,
    };
  } catch {
    return null;
  }
}

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      req.dbUser = (await resolveUserFromToken(token)) ?? undefined;
    }
  }
  next();
};

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول للمتابعة.' });
  }
  const token = authHeader.slice(7).trim();
  const dbUser = await resolveUserFromToken(token);
  if (!dbUser) {
    return res
      .status(401)
      .json({ error: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً.' });
  }
  req.dbUser = dbUser;
  next();
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (
    !req.dbUser ||
    (req.dbUser.role !== 'admin' && req.dbUser.role !== 'manager')
  ) {
    return res
      .status(403)
      .json({ error: 'صلاحيات الإدارة مطلوبة للوصول إلى هذا القسم.' });
  }
  next();
};
