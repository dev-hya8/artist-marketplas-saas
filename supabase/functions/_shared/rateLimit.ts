import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetIn: number; // seconds until oldest request expires
}

/**
 * Check if a user has admin role
 * @param supabase - Supabase client with service role
 * @param userId - User ID to check
 * @returns true if user is admin, false otherwise
 */
async function isAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Exception checking admin status:', error);
    return false;
  }
}

/**
 * Check if request should be rate limited using sliding window algorithm
 * 
 * @param supabase - Supabase client (should use service role key)
 * @param identifier - IP address (for anonymous) or user_id (for authenticated)
 * @param endpoint - The endpoint path being accessed (e.g., '/functions/generate-invoice')
 * @param limit - Maximum number of requests allowed in 60 seconds (default: 30)
 * @returns RateLimitResult indicating if request is allowed
 * 
 * @example
 * ```typescript
 * const result = await checkRateLimit(supabase, clientIp, '/functions/update-artist-content', 30);
 * if (!result.allowed) {
 *   return new Response(JSON.stringify({ 
 *     error: 'Too many requests',
 *     retryAfter: result.resetIn 
 *   }), { 
 *     status: 429,
 *     headers: { 'Retry-After': result.resetIn.toString() }
 *   });
 * }
 * ```
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  identifier: string,
  endpoint: string,
  limit: number = 30
): Promise<RateLimitResult> {
  
  if (!identifier || !endpoint) {
    console.error('Rate limit check failed: missing identifier or endpoint');
    return { allowed: false, remaining: 0, limit, resetIn: 60 };
  }

  try {
    // Admin Bypass: Check if identifier is a UUID (user_id) and if they're an admin
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(identifier)) {
      const adminCheck = await isAdmin(supabase, identifier);
      if (adminCheck) {
        console.log(`Admin user ${identifier} bypassed rate limit for ${endpoint}`);
        return { allowed: true, remaining: limit, limit, resetIn: 0 };
      }
    }

    // Cleanup old entries (older than 2 minutes) before checking
    // This keeps the table size manageable
    const { error: cleanupError } = await supabase.rpc('cleanup_old_rate_limits');
    if (cleanupError) {
      console.warn('Cleanup function failed (non-critical):', cleanupError);
    }

    // Sliding Window Query: Count requests in the last 60 seconds
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString();
    
    const { data: recentRequests, error: countError } = await supabase
      .from('rate_limits')
      .select('created_at', { count: 'exact', head: false })
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('created_at', sixtySecondsAgo)
      .order('created_at', { ascending: true });

    if (countError) {
      console.error('Error querying rate_limits:', countError);
      // On error, allow the request (fail open for availability)
      return { allowed: true, remaining: limit, limit, resetIn: 60 };
    }

    const requestCount = recentRequests?.length || 0;
    const remaining = Math.max(0, limit - requestCount);

    // Calculate resetIn: seconds until oldest request expires from the 60s window
    let resetIn = 60;
    if (recentRequests && recentRequests.length > 0) {
      const oldestRequestTime = new Date(recentRequests[0].created_at).getTime();
      const expiresAt = oldestRequestTime + 60 * 1000;
      resetIn = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000));
    }

    console.log(`Rate limit check for ${identifier} on ${endpoint}: ${requestCount}/${limit} requests`);

    // If under limit, log the request and allow
    if (requestCount < limit) {
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({
          identifier,
          endpoint,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error logging rate limit request:', insertError);
        // Still allow the request even if logging fails
      }

      return { allowed: true, remaining: remaining - 1, limit, resetIn };
    }

    // Limit exceeded
    console.warn(`Rate limit exceeded for ${identifier} on ${endpoint}: ${requestCount}/${limit}`);
    return { allowed: false, remaining: 0, limit, resetIn };

  } catch (error) {
    console.error('Exception in checkRateLimit:', error);
    // Fail open: allow request on unexpected errors to maintain availability
    return { allowed: true, remaining: limit, limit, resetIn: 60 };
  }
}

/**
 * Helper function to create a 429 Too Many Requests response
 * 
 * @param result - Rate limit result from checkRateLimit
 * @param corsHeaders - CORS headers to include in response
 * @returns Response object with 429 status
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: `Rate limit of ${result.limit} requests per minute exceeded. Please try again in ${result.resetIn} seconds.`,
      retryAfter: result.resetIn
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': result.resetIn.toString(),
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetIn.toString()
      }
    }
  );
}
