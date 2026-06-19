import 'dotenv/config';
import { config as dotenvSafeConfig } from 'dotenv-safe';
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

// Load dotenv-safe in development to ensure required vars are present if using that flow.
try {
  // .env.example will list required server env vars; dotenv-safe will throw if any are missing when used.
  dotenvSafeConfig({ example: '.env.example', allowEmptyValues: true });
} catch (e: any) {
  // Log warning so missing envs in non-strict environments are visible
  logger.warn({ err: e }, 'dotenv-safe check failed (non-fatal)');
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

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
    // Strict: no local fallback in code. Tests should mock this middleware instead.
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parts = authHeader.split(' ');
  const token = parts.length === 2 ? parts[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!supabase) {
    logger.error('Supabase client not configured on the server.');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      logger.warn({ err: error }, 'Error verifying Supabase token');
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
    logger.error({ err: e }, 'Error verifying Supabase token');
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
