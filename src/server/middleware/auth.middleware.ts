import { Request, Response, NextFunction } from 'express';
import { logger } from '../observability/logger';
import { getSupabaseServerClient } from '../db/supabase-server';
import { Database } from '../../types/supabase';

// Extend Express Request type to include user and auth properties
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'citizen' | 'admin';
    cpf?: string;
    phone?: string;
    cityState?: string;
    avatarUrl?: string;
    createdAt: string;
  };
  auth?: any; // Supabase user object
}

/**
 * Middleware to authenticate JWT token and attach user to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token de acesso não fornecido' 
      });
    }

    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase Auth
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return res.status(500).json({ 
        error: 'Serviço de autenticação não disponível' 
      });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !userData.user) {
      logger.warn('auth', 'middleware', 'authenticate', 'Invalid or expired token', { 
        error: userError?.message 
      });
      return res.status(401).json({ 
        error: 'Token inválido ou expirado' 
      });
    }

    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows returned
      logger.error('auth', 'middleware', 'authenticate', 'Failed to fetch user profile', { 
        error: profileError.message,
        userId: userData.user.id
      });
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }

    // Attach user to request object
    req.user = {
      id: userData.user.id,
      email: userData.user.email ?? '',
      name: profileData?.name ?? '',
      role: profileData?.role as 'citizen' | 'admin' || 'citizen',
      cpf: profileData?.cpf ?? undefined,
      phone: profileData?.phone ?? undefined,
      cityState: profileData?.city_state ?? undefined,
      avatarUrl: profileData?.avatar_url ?? undefined,
      createdAt: userData.user.created_at ?? new Date().toISOString(),
    };

    // Attach raw Supabase user data if needed
    req.auth = userData.user;

    next();
  } catch (error: any) {
    logger.error('auth', 'middleware', 'authenticate', 'Unexpected error during authentication', { 
      error: error.message 
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const authorizeAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Não autenticado' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Acesso negado. Permissão de administrador necessária' 
    });
  }

  next();
};

/**
 * Middleware to check if user has citizen role (or any role)
 */
export const authorizeCitizen = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Não autenticado' 
    });
  }

  // Allow any authenticated user (citizen or admin)
  next();
};

export default { authenticate, authorizeAdmin, authorizeCitizen };