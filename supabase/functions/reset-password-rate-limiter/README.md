# Supabase Edge Function for Rate Limiting Password Reset Requests

## Overview
This document describes the implementation of a Supabase Edge Function to provide backend rate limiting for password reset requests. While frontend rate limiting is implemented in `ForgotPasswordForm.tsx`, backend rate limiting provides an additional layer of security that cannot be bypassed by disabling JavaScript or modifying frontend code.

## File Location
`supabase/functions/reset-password-rate-limiter/index.ts`

## Implementation Details

### Purpose
To limit the number of password reset requests that can be made for a given email address or IP address within a specific time window, preventing abuse and reducing the risk of email spam.

### Rate Limiting Strategy
- **Per-Email Limit**: Maximum 5 requests per hour per email address
- **Per-IP Limit**: Maximum 20 requests per hour per IP address
- **Burst Protection**: Maximum 3 requests within 5 minutes to prevent burst attacks

### Technologies Used
- Supabase Edge Functions (Denoland/runtime)
- Supabase Database for storing rate limiting counters
- Redis-like in-memory store (using Deno's KV storage or database tables)

### Function Workflow
1. Extract email and IP address from request
2. Check rate limiting counters in database
3. If limits exceeded, return 429 Too Many Requests
4. If within limits, increment counters and call the actual Supabase resetPassword function
5. Return success/failure response

### Database Schema
Would require a table to store rate limiting data:

```sql
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id BIGSERIAL PRIMARY KEY,
  identifier TEXT NOT NULL, -- email or ip:address
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('email', 'ip')),
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(identifier, identifier_type, window_start)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_identifier ON auth_rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_window ON auth_rate_limits(window_start);
```

### Environment Variables
The function would need access to:
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for calling Supabase admin APIs
- Rate limit configuration (could be hardcoded or stored in a config table)

### Error Handling
- Returns 429 status with JSON body when rate limited
- Returns 400 for invalid requests
- Returns 500 for internal errors
- Logs all rate limiting events for monitoring

### Example Response When Rate Limited
```json
{
  "error": "Rate limit exceeded",
  "message": "Muitas solicitações de recuperação de senha. Por favor, aguarde antes de tentar novamente.",
  "retry_after": 3600,
  "limit": {
    "type": "email",
    "identifier": "user@example.com",
    "window": "1 hour",
    "remaining": 0,
    "reset": "2026-08-18T15:00:00Z"
  }
}
```

### Implementation Notes
1. This function would wrap the actual Supabase `resetPassword` API call
2. Would need to be called from the frontend instead of the direct Supabase client method
3. Should implement proper IP address extraction (considering proxies, load balancers)
4. Should include request validation and sanitization
5. Would benefit from integration with Supabase's built-in rate limiting if available in future versions

### Deployment Instructions
1. Install Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link to project: `supabase link --project-ref YOUR_PROJECT_REF`
4. Deploy function: `supabase functions deploy reset-password-rate-liner`

### Security Considerations
- Implement proper authentication checks if needed
- Log all access attempts for security monitoring
- Consider implementing CAPTCHA for repeated offenders
- Regularly review rate limit thresholds based on observed usage patterns