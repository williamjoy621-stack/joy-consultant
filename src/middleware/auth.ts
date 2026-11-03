import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { adminAuth } from '../lib/firebase-admin.ts';

export interface AuthUserPayload {
  uid: string;
  email?: string;
  name?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUserPayload;
}

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.SQL_PASSWORD ||
  'joy-consultant-cadastral-secret-key-2026';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  const keyBuf = Buffer.from(key, 'hex');
  const derivedBuf = Buffer.from(derived, 'hex');
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

export function createCustomerSessionToken(payload: {
  uid: string;
  email: string;
  name: string;
}): string {
  const data = Buffer.from(
    JSON.stringify({
      uid: payload.uid,
      email: payload.email,
      name: payload.name,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');
  return `jc_sess.${data}.${sig}`;
}

export function verifyCustomerSessionToken(token: string): AuthUserPayload | null {
  if (!token.startsWith('jc_sess.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, data, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (parsed.exp && Date.now() > parsed.exp) return null;
    return {
      uid: parsed.uid,
      email: parsed.email,
      name: parsed.name,
    };
  } catch {
    return null;
  }
}

async function resolveBearerToken(token: string): Promise<AuthUserPayload | null> {
  if (token.startsWith('jc_sess.')) {
    return verifyCustomerSessionToken(token);
  }
  const decoded = await adminAuth.verifyIdToken(token);
  return {
    uid: decoded.uid,
    email: decoded.email,
    name: (decoded as any).name || decoded.email?.split('@')[0],
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const userPayload = await resolveBearerToken(token);
    if (!userPayload) {
      return res.status(401).json({ error: 'Unauthorized: Invalid session token' });
    }
    req.user = userPayload;
    next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const userPayload = await resolveBearerToken(token);
      if (userPayload) {
        req.user = userPayload;
      }
    } catch {
      // Ignore invalid optional token
    }
  }
  next();
};
