import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

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
    if (!supabase) {
      // Local fallback mode when Supabase credentials are not configured yet
      req.user = { uid: 'local-mock-user-id', email: 'fallback-user@example.com', displayName: 'Mock User' };
      req.dbUser = { id: 'local-mock-user-id', uid: 'local-mock-user-id', email: 'fallback-user@example.com' };
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  
  if (supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        throw error || new Error('Invalid Supabase token');
      }
      
      req.user = {
        uid: user.id,
        email: user.email || '',
        displayName: user.user_metadata?.display_name || user.email?.split('@')[0],
      };
      
      req.dbUser = {
        id: user.id,
        uid: user.id,
        email: user.email || ''
      };
      
      next();
    } catch (e: any) {
      console.error('Error verifying Supabase token:', e.message);
      return res.status(401).json({ error: 'Unauthorized: Invalid Supabase token' });
    }
  } else {
    // Local offline sandbox mode
    req.user = { uid: 'local-mock-user-id', email: 'fallback-user@example.com', displayName: 'Mock User' };
    req.dbUser = { id: 'local-mock-user-id', uid: 'local-mock-user-id', email: 'fallback-user@example.com' };
    next();
  }
};
