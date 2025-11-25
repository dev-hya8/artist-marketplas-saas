-- Create rate_limits table for sliding window rate limiting
CREATE TABLE public.rate_limits (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL
);

-- Create composite index for optimal sliding window queries
-- This index supports: WHERE identifier = X AND endpoint = Y AND created_at > Z
CREATE INDEX idx_rate_limits_sliding_window 
ON public.rate_limits (identifier, endpoint, created_at DESC);

-- Create index for cleanup queries (removing old entries)
CREATE INDEX idx_rate_limits_created_at 
ON public.rate_limits (created_at);

-- Enable RLS (though rate limiting typically uses service role)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admins can view all rate limit logs"
ON public.rate_limits
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create automatic cleanup function to remove entries older than 2 minutes
-- (keeps table size manageable since we only need last 60 seconds for rate limiting)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE created_at < NOW() - INTERVAL '2 minutes';
END;
$$;

-- Add comment for documentation
COMMENT ON TABLE public.rate_limits IS 
'Stores request timestamps for sliding window rate limiting. Supports both IP-based (anonymous) and user_id-based (authenticated) rate limiting per endpoint.';

COMMENT ON COLUMN public.rate_limits.identifier IS 
'IP address for anonymous requests, or user_id for authenticated requests';

COMMENT ON COLUMN public.rate_limits.endpoint IS 
'The edge function path being accessed (e.g., /functions/generate-invoice)';

COMMENT ON FUNCTION public.cleanup_old_rate_limits() IS 
'Removes rate limit entries older than 2 minutes to keep table size manageable. Call periodically via cron or before rate limit checks.';