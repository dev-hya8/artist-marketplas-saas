import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No token provided' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Fetching transaction history for user: ${user.id}`)

    // Fetch user's transaction history
    // RLS policy automatically filters to only show this user's invoices
    // No explicit user_id filter needed - RLS handles authorization
    const { data: invoices, error: queryError } = await supabase
      .from('invoices')
      .select(`
        *,
        artworks (
          title,
          image_url,
          medium,
          dimensions
        )
      `)
      .order('created_at', { ascending: false })

    if (queryError) {
      console.error('Query error:', queryError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch transaction history' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Successfully fetched ${invoices?.length || 0} transactions`)

    return new Response(
      JSON.stringify({ 
        success: true,
        transactions: invoices,
        count: invoices?.length || 0
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in get-transaction-history:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})