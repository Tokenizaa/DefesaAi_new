import { Router } from 'express';
import { logger } from '../observability/logger';
import { getSupabaseServerClient } from '../db/supabase-server';
import { Database } from '../../types/supabase';
import { rateLimit } from '../middleware/rate-limit.middleware';

const router = Router();

// Get Supabase server client
const supabase = getSupabaseServerClient();

if (!supabase) {
  logger.warn('auth', 'routes', 'init', 'Supabase server client not available. Auth routes will not function properly.');
}

/**
 * @route POST /auth/login
 * @desc Login user with email and password
 * @access Public
 */
router.post('/login', rateLimit(), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios' 
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      logger.warn('auth', 'routes', 'login', `Login failed for email: ${normalizedEmail}`, { 
        error: error.message 
      });
      
      // Don't reveal whether email exists or not for security
      return res.status(401).json({ 
        error: 'Credenciais inválidas' 
      });
    }

    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows returned
      logger.error('auth', 'routes', 'login', 'Failed to fetch user profile', { 
        error: profileError.message,
        userId: data.user.id
      });
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }

    // Prepare user response
    const user = {
      id: data.user.id,
      email: data.user.email ?? '',
      name: profileData?.name ?? '',
      role: profileData?.role as 'citizen' | 'admin' || 'citizen',
      cpf: profileData?.cpf ?? undefined,
      phone: profileData?.phone ?? undefined,
      cityState: profileData?.city_state ?? undefined,
      avatarUrl: profileData?.avatar_url ?? undefined,
      createdAt: data.user.created_at ?? new Date().toISOString(),
    };

    logger.info('auth', 'routes', 'login', `User logged in successfully: ${normalizedEmail}`, { 
      userId: data.user.id 
    });

    res.json({
      user,
      session: {
        access_token: data.session?.access_token ?? '',
        refresh_token: data.session?.refresh_token ?? '',
        expires_in: data.session?.expires_in ?? 0,
        token_type: data.session?.token_type ?? 'bearer',
      }
    });
  } catch (error: any) {
    logger.error('auth', 'routes', 'login', 'Unexpected error during login', { 
      error: error.message 
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

/**
 * @route POST /auth/register
 * @desc Register new user
 * @access Public
 */
router.post('/register', rateLimit(), async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Nome, email e senha são obrigatórios' 
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Email inválido' 
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Senha deve ter pelo menos 8 caracteres' 
      });
    }

    // Normalize inputs
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedName = name.trim();
    let normalizedPhone = phone?.trim() || null;

    // Normalize phone to E.164 format if provided
    if (normalizedPhone) {
      normalizedPhone = normalizeToE164(normalizedPhone);
      if (!normalizedPhone) {
        return res.status(400).json({ 
          error: 'Número de telefone inválido' 
        });
      }
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (!checkError && existingUser) {
      logger.warn('auth', 'routes', 'register', `Registration attempted with existing email: ${normalizedEmail}`);
      return res.status(409).json({ 
        error: 'Usuário já existe com este email' 
      });
    }

    // Check if phone already exists (if provided)
    if (normalizedPhone) {
      const { data: existingPhoneUser, error: phoneCheckError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('phone', normalizedPhone)
        .single();

      if (!phoneCheckError && existingPhoneUser) {
        logger.warn('auth', 'routes', 'register', `Registration attempted with existing phone: ${normalizedPhone}`);
        return res.status(409).json({ 
          error: 'Usuário já existe com este telefone' 
        });
      }
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          name: normalizedName,
          phone: normalizedPhone,
        }
      }
    });

    if (authError) {
      logger.error('auth', 'routes', 'register', 'Failed to create user in Supabase Auth', { 
        error: authError.message,
        email: normalizedEmail
      });
      return res.status(400).json({ 
        error: 'Erro ao criar conta' 
      });
    }

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        role: 'citizen', // Default role
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: authData.user.id, // Add the required user_id field
      })
      .select()
      .single();

    if (profileError) {
      logger.error('auth', 'routes', 'register', 'Failed to create user profile', { 
        error: profileError.message,
        userId: authData.user.id
      });
      
      // Attempt to clean up the auth user (though this might not be necessary)
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }

    logger.info('auth', 'routes', 'register', `User registered successfully: ${normalizedEmail}`, { 
      userId: authData.user.id 
    });

    // Prepare user response (without sensitive data)
    const user = {
      id: authData.user.id,
      email: authData.user.email ?? '',
      name: normalizedName,
      role: 'citizen',
      cpf: undefined,
      phone: normalizedPhone,
      cityState: undefined,
      avatarUrl: undefined,
      createdAt: authData.user.created_at ?? new Date().toISOString(),
    };

    res.status(201).json({
      user,
      session: {
        access_token: authData.session?.access_token ?? '',
        refresh_token: authData.session?.refresh_token ?? '',
        expires_in: authData.session?.expires_in ?? 0,
        token_type: authData.session?.token_type ?? 'bearer',
      }
    });
  } catch (error: any) {
    logger.error('auth', 'routes', 'register', 'Unexpected error during registration', { 
      error: error.message 
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

/**
 * @route POST /auth/forgot-password
 * @desc Send password reset email
 * @access Public
 */
router.post('/forgot-password', rateLimit(), async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ 
        error: 'Email é obrigatório' 
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Send password reset email
    // Note: We don't check if email exists to prevent user enumeration
const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
       redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
     });

    // Always return success to prevent email enumeration
    logger.info('auth', 'routes', 'forgot-password', `Password reset email processed for: ${normalizedEmail}`);
    
    res.json({ 
      message: 'Se o email existir em nosso sistema, você receberá instruções para redefinir sua senha.' 
    });
  } catch (error: any) {
    logger.error('auth', 'routes', 'forgot-password', 'Unexpected error during password reset request', { 
      error: error.message 
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

/**
 * @route POST /auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', rateLimit(), async (req, res) => {
  try {
    const { access_token: token, new_password: password } = req.body;

    // Validate input
    if (!token || !password) {
      return res.status(400).json({ 
        error: 'Token e nova senha são obrigatórios' 
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Senha deve ter pelo menos 8 caracteres' 
      });
    }

    // First, get the user using the token to verify it's valid
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  
  if (userError || !userData.user) {
    logger.warn('auth', 'routes', 'reset-password', 'Invalid or expired token', { 
      error: userError?.message 
    });
    return res.status(401).json({ 
      error: 'Token inválido ou expirado' 
    });
  }
  
  // Update password for the authenticated user
  const { error } = await supabase.auth.updateUser({
    password: password,
  });

    if (error) {
      logger.warn('auth', 'routes', 'reset-password', 'Failed to reset password', { 
        error: error.message 
      });
      return res.status(400).json({ 
        error: 'Token inválido ou expirado' 
      });
    }

    logger.info('auth', 'routes', 'reset-password', 'Password reset successful');
    
    res.json({ 
      message: 'Senha redefinida com sucesso' 
    });
  } catch (error: any) {
    logger.error('auth', 'routes', 'reset-password', 'Unexpected error during password reset', { 
      error: error.message 
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

/**
 * @route POST /auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', async (req, res) => {
  try {
    // Get access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token de acesso não fornecido' 
      });
    }

    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Sign out from Supabase Auth
    const { error } = await supabase.auth.signOut({ 
      // We could pass the access token here if needed
    });

    if (error) {
      logger.warn('auth', 'routes', 'logout', 'Failed to sign out', { 
        error: error.message 
      });
      // Continue anyway to clear client-side session
    }

    logger.info('auth', 'routes', 'logout', 'User logged out successfully');
    
    res.json({ 
      message: 'Logout realizado com sucesso' 
    });
  } catch (error: any) {
    logger.error('auth', 'routes', 'logout', 'Unexpected error during logout', { 
      error: error.message 
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

/**
 * @route POST /auth/claim-anonymous-case
 * @desc Claim an anonymous case for a user
 * @access Private
 */
router.post('/claim-anonymous-case', async (req, res) => {
  try {
    const { claim_token: claimToken, user_id: userId } = req.body;

    // Validate input
    if (!claimToken || !userId) {
      return res.status(400).json({ 
        error: 'Token de claim e ID do usuário são obrigatórios' 
      });
    }

    // Get access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token de acesso não fornecido' 
      });
    }

    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the user making the request matches the user_id in the body
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !userData.user) {
      logger.warn('auth', 'routes', 'claim-anonymous-case', 'Invalid user token', { 
        error: userError?.message 
      });
      return res.status(401).json({ 
        error: 'Não autorizado' 
      });
    }

    if (userData.user.id !== userId) {
      logger.warn('auth', 'routes', 'claim-anonymous-case', 'User ID mismatch', { 
        tokenUserId: userData.user.id,
        bodyUserId: userId
      });
      return res.status(403).json({ 
        error: 'Não autorizado' 
      });
    }

    // Check if the anonymous case exists and belongs to no user yet
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('claim_token', claimToken)
      .is('user_id', null) // Only claim if not already claimed
      .single();

    if (caseError) {
      if (caseError.code === 'PGRST116') { // No rows returned
        logger.warn('auth', 'routes', 'claim-anonymous-case', 'Anonymous case not found or already claimed', { 
          claimToken
        });
        return res.status(404).json({ 
          error: 'Caso anônimo não encontrado ou já foi reclamado' 
        });
      }
      
      logger.error('auth', 'routes', 'claim-anonymous-case', 'Failed to fetch anonymous case', { 
        error: caseError.message,
        claimToken
      });
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }

    // Update the case to associate it with the user
    const { data: updatedCase, error: updateError } = await supabase
      .from('cases')
      .update({
        user_id: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('claim_token', claimToken)
      .select()
      .single();

    if (updateError) {
      logger.error('auth', 'routes', 'claim-anonymous-case', 'Failed to claim anonymous case', { 
        error: updateError.message,
        claimToken,
        userId
      });
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }

    logger.info('auth', 'routes', 'claim-anonymous-case', 'Anonymous case claimed successfully', { 
      claimToken,
      userId,
      caseId: updatedCase.id
    });

    // Return the updated case data (mapped to domain format)
    res.json({
      success: true,
      case: {
        id: updatedCase.id,
        title: updatedCase.title,
        aitNumber: updatedCase.ait_number,
        clientName: updatedCase.client_name,
        clientEmail: updatedCase.client_email,
        clientPhone: updatedCase.client_phone,
        clientCpf: updatedCase.client_cpf,
        vehiclePlate: updatedCase.vehicle_plate,
        vehicleBrandModel: updatedCase.vehicle_brand_model,
        vehicleYear: updatedCase.vehicle_year,
        infractionDescription: updatedCase.infraction_description,
        ctbArticle: updatedCase.ctb_article,
        location: updatedCase.location,
        dateTime: updatedCase.date_time,
        measuredSpeed: updatedCase.measured_speed,
        speedLimit: updatedCase.speed_limit,
        fineAmount: updatedCase.fine_amount,
        points: updatedCase.points,
        severity: updatedCase.severity,
        serviceType: updatedCase.service_type,
        status: updatedCase.status,
        isAnonymous: updatedCase.is_anonymous,
        isPaid: updatedCase.is_paid,
        createdAt: updatedCase.created_at,
        updatedAt: updatedCase.updated_at,
      }
    });
  } catch (error: any) {
    logger.error('auth', 'routes', 'claim-anonymous-case', 'Unexpected error during case claim', { 
      error: error.message 
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

/**
 * @route GET /auth/user/:claimToken
 * @desc Get anonymous case data by claim token (for onboarding)
 * @access Public
 */
router.get('/user/:claimToken', async (req, res) => {
  try {
    const { claimToken } = req.params;

    if (!claimToken) {
      return res.status(400).json({ 
        error: 'Token de claim é obrigatório' 
      });
    }

    // Get the anonymous case
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('claim_token', claimToken)
      .single();

    if (caseError) {
      if (caseError.code === 'PGRST116') { // No rows returned
        return res.status(404).json({ 
          error: 'Caso anônimo não encontrado' 
        });
      }
      
      logger.error('auth', 'routes', 'get-anonymous-case', 'Failed to fetch anonymous case', { 
        error: caseError.message,
        claimToken
      });
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }

    // Check if case is already claimed
    if (caseData.user_id) {
      return res.status(409).json({ 
        error: 'Caso já foi reclamado por outro usuário' 
      });
    }

    // Return case data (without sensitive information that shouldn't be exposed before claiming)
    res.json({
      case: {
        id: caseData.id,
        title: caseData.title,
        aitNumber: caseData.ait_number,
        clientName: caseData.client_name,
        // Note: Not returning email, phone, CPF for security until claimed
        vehiclePlate: caseData.vehicle_plate,
        vehicleBrandModel: caseData.vehicle_brand_model,
        vehicleYear: caseData.vehicle_year,
        infractionDescription: caseData.infraction_description,
        ctbArticle: caseData.ctb_article,
        location: caseData.location,
        dateTime: caseData.date_time,
        measuredSpeed: caseData.measured_speed,
        speedLimit: caseData.speed_limit,
        fineAmount: caseData.fine_amount,
        points: caseData.points,
        severity: caseData.severity,
        serviceType: caseData.service_type,
        status: caseData.status,
        isAnonymous: caseData.is_anonymous,
        isPaid: caseData.is_paid,
        createdAt: caseData.created_at,
        updatedAt: caseData.updated_at,
      }
    });
  } catch (error: any) {
    logger.error('auth', 'routes', 'get-anonymous-case', 'Unexpected error fetching anonymous case', { 
      error: error.message 
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

/**
 * @route PUT /auth/profile
 * @desc Update user profile with onboarding data
 * @access Private
 */
router.put('/profile', async (req, res) => {
  try {
    const { name, phone, cpf, cityState } = req.body;

    // Get access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token de acesso não fornecido' 
      });
    }

    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify user
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !userData.user) {
      logger.warn('auth', 'routes', 'update-profile', 'Invalid user token', { 
        error: userError?.message 
      });
      return res.status(401).json({ 
        error: 'Não autorizado' 
      });
    }

    // Validate input
    if (!name && !phone && !cpf && !cityState) {
      return res.status(400).json({ 
        error: 'Pelo menos um campo deve ser fornecido para atualização' 
      });
    }

    // Normalize phone if provided
    let normalizedPhone = null;
    if (phone !== undefined && phone !== null && phone.trim() !== '') {
      normalizedPhone = normalizeToE164(phone.trim());
      if (!normalizedPhone) {
        return res.status(400).json({ 
          error: 'Número de telefone inválido' 
        });
      }
    }

    // Check if phone already exists by another user (if provided)
    if (normalizedPhone) {
      const { data: existingPhoneUser, error: phoneCheckError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('phone', normalizedPhone)
        .neq('id', userData.user.id) // Exclude current user
        .single();

      if (!phoneCheckError && existingPhoneUser) {
        logger.warn('auth', 'routes', 'update-profile', 'Phone already exists for another user', { 
          phone: normalizedPhone,
          userId: userData.user.id
        });
        return res.status(409).json({ 
          error: 'Este telefone já está em uso por outro usuário' 
        });
      }
    }

    // Update user profile
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = normalizedPhone;
    if (cpf !== undefined) updateData.cpf = cpf?.trim() || null;
    if (cityState !== undefined) updateData.city_state = cityState?.trim() || null;

    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userData.user.id)
      .select()
      .single();

    if (profileError) {
      logger.error('auth', 'routes', 'update-profile', 'Failed to update user profile', { 
        error: profileError.message,
        userId: userData.user.id
      });
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }

    // Also update the auth user metadata if name changed
    if (name !== undefined) {
      await supabase.auth.updateUser({
        data: {
          name: name.trim(),
        }
      });
    }

    logger.info('auth', 'routes', 'update-profile', 'User profile updated successfully', { 
      userId: userData.user.id
    });

    // Return updated profile
    res.json({
      user: {
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        role: profileData.role as 'citizen' | 'admin',
        cpf: profileData.cpf,
        phone: profileData.phone,
        cityState: profileData.city_state,
        avatarUrl: profileData.avatar_url,
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,
      }
    });
  } catch (error: any) {
    logger.error('auth', 'routes', 'update-profile', 'Unexpected error updating profile', { 
      error: error.message 
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor' 
    });
  }
});

/**
 * Normalize phone number to E.164 format
 * @param phone Phone number to normalize
 * @returns Normalized phone number in E.164 format or null if invalid
 */
function normalizeToE164(phone: string): string | null {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Check if we have a valid number of digits
  // Brazilian phone numbers: 10 or 11 digits (with area code)
  if (digits.length < 10 || digits.length > 11) {
    return null;
  }
  
  // If it's 10 digits, assume it's a landline (DDD + number)
  // If it's 11 digits, assume it's a mobile (DDD + 9 + number)
  // Add country code for Brazil (+55)
  
  // For simplicity, we'll just add the country code
  // In a real implementation, you might want to validate the DDD
  return `+55${digits}`;
}

export default router;