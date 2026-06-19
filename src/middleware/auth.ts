import 'dotenv/config';
import { config as dotenvSafeConfig } from 'dotenv-safe';
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Load dotenv-safe in development to ensure required vars are present if using that flow.
try {
  // .env.example will list required server env vars; dotenv-safe will throw if any are missing when used.
  dotenvSafeConfig({ example: '.env.example', allowEmptyValues: true });
} catch (e) {
  // swallow in case dotenv-safe isn't configured in environments where it's not wanted
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

const allowLocalFallback = process.env.NODE_ENV !== 'production' && process.env.ALLOW_LOCAL_FALLBACK === 'true';

const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    displayName?: string;
  };
  dbUser?: any;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (allowLocalFallback) {
      req.user = { uid: 'local-mock-user-id', email: 'fallback-user@example.com', displayName: 'Mock User' };
      req.dbUser = { id: 'local-mock-user-id', uid: 'local-mock-user-id', email: 'fallback-user@example.com' };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parts = authHeader.split(' ');
  const token = parts.length === 2 ? parts[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!supabase) {
    console.error('Supabase client not configured on the server.');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      console.error('Error verifying Supabase token:', error?.message ?? 'no user returned');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = data.user;
    req.user = {
      uid: user.id,
      email: user.email || '',
      displayName: (user.user_metadata as any)?.display_name || user.email?.split('@')[0],
    };

    req.dbUser = {
      id: user.id,
      uid: user.id,
      email: user.email || ''
    };

    next();
  } catch (e: any) {
    console.error('Error verifying Supabase token:', e);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
