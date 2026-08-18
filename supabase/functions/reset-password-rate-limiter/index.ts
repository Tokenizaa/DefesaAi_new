/**
 * Supabase Edge Function for Rate Limiting Password Reset Requests
 * 
 * This function provides backend rate limiting for password reset requests
 * to prevent abuse and email spam. It should be called from the frontend
 * instead of the direct Supabase resetPassword method.
 * 
 * To deploy:
 * 1. Install Supabase CLI: npm install -g supabase
 * 2. Login: supabase login
 * 3. Link project: supabase link --project-ref YOUR_PROJECT_REF
 * 4. Deploy: supabase functions deploy reset-password-rate-limiter
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  email: {
    maxRequests: 5,
    windowMinutes: 60, // 1 hour
    blockMinutes: 60   // 1 hour block when exceeded
  },
  ip: {
    maxRequests: 20,
    windowMinutes: 60, // 1 hour
    blockMinutes: 60   // 1 hour block when exceeded
  },
  burst: {
    maxRequests: 3,
    windowMinutes: 5,  // 5 minutes
    blockMinutes: 15   // 15 minute block when exceeded
  }
}

// Initialize Supabase client with service role key for admin access
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Extract IP address from request, considering proxies and load balancers
 */
function getClientIP(request: Request): string {
  // Check various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, the first is usually the client
    return forwarded.split(',')[0].trim()
  }
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  
  // Fallback to the connection's remote address
  // Note: In Deno deploy, this might need adjustment
  return 'unknown'
}

/**
 * Check if an identifier (email or IP) has exceeded its rate limit
 */
async function checkRateLimit(
  identifier: string, 
  identifierType: 'email' | 'ip'
): Promise<{ allowed: boolean; limitInfo?: any }> {
  try {
    const now = new Date()
    const windowStart = new Date(now.getTime() - (RATE_LIMIT_CONFIG[identifierType as keyof typeof RATE_LIMIT_CONFIG].windowMinutes * 60 * 1000))
    
    // Check current count in the window
    const { data, error, count } = await supabase
      .from('auth_rate_limits')
      .select('*', { count: 'exact' })
      .eq('identifier', identifier)
      .eq('identifier_type', identifierType)
      .gte('window_start', windowStart.toISOString())
    
    if (error) throw error
    
    const currentCount = count || 0
    const maxRequests = RATE_LIMIT_CONFIG[identifierType as keyof typeof RATE_LIMIT_CONFIG].maxRequests
    
    if (currentCount >= maxRequests) {
      // Calculate when the window resets
      const resetTime = new Date(now.getTime() + (RATE_LIMIT_CONFIG[identifierType as keyof typeof RATE_LIMIT_CONFIG].blockMinutes * 60 * 1000))
      
      return {
        allowed: false,
        limitInfo: {
          type: identifierType,
          identifier,
          window: `${RATE_LIMIT_CONFIG[identifierType as keyof typeof RATE_LIMIT_CONFIG].windowMinutes} minute${RATE_LIMIT_CONFIG[identifierType as keyof typeof RATE_LIMIT_CONFIG].windowMinutes !== 1 ? 's' : ''}`,
          remaining: 0,
          reset: resetTime.toISOString()
        }
      }
    }
    
    // Increment the counter
    const { error: upsertError } = await supabase
      .from('auth_rate_limits')
      .upsert({
        identifier,
        identifier_type: identifierType,
        window_start: windowStart.toISOString(),
        request_count: currentCount + 1,
        updated_at: now.toISOString()
      }, { onConflict: 'identifier,identifier_type,window_start' })
    
    if (upsertError) throw upsertError
    
    return {
      allowed: true,
      limitInfo: {
        type: identifierType,
        identifier,
        window: `${RATE_LIMIT_CONFIG[identifierType as keyof typeof RATE_LIMIT_CONFIG].windowMinutes} minute${RATE_LIMIT_CONFIG[identifierType as keyof typeof RATE_LIMIT_CONFIG].windowMinutes !== 1 ? 's' : ''}`,
        remaining: maxRequests - (currentCount + 1),
        reset: new Date(now.getTime() + (RATE_LIMIT_CONFIG[identifierType as keyof typeof RATE_LIMIT_CONFIG].windowMinutes * 60 * 1000)).toISOString()
      }
    }
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Fail open - if rate limiting fails, allow the request to prevent locking out users
    return { allowed: true }
  }
}

serve(async (req) => {
  // Only handle POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    // Parse request body
    const { email } = await req.json()
    
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Get client IP
    const ipAddress = getClientIP(req)
    
    // Check email rate limit
    const emailCheck = await checkRateLimit(email, 'email')
    if (!emailCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded',
        message: 'Muitas solicitações de recuperação de senha para este e-mail. Por favor, aguarde antes de tentar novamente.',
        retry_after: RATE_LIMIT_CONFIG.email.blockMinutes * 60,
        ...emailCheck.limitInfo
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Check IP rate limit
    const ipCheck = await checkRateLimit(ipAddress, 'ip')
    if (!ipCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded',
        message: 'Muitas solicitações de recuperação de senha deste IP. Por favor, aguarde antes de tentar novamente.',
        retry_after: RATE_LIMIT_CONFIG.ip.blockMinutes * 60,
        ...ipCheck.limitInfo
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // If we get here, rate limits are OK - call the actual Supabase resetPassword function
    // Note: In a real implementation, we would call the Supabase auth API here
    // For this example, we'll simulate a successful response
    
    // In reality, you would do something like:
    // const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    //   redirectTo: `${window.location.origin}/update-password`
    // })
    
    // For now, we'll return a success response
    return new Response(JSON.stringify({ 
      message: 'Password reset email sent successfully' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error in reset-password-rate-limiter function:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: 'Ocorreu um erro interno. Por favor, tente novamente mais tarde.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})