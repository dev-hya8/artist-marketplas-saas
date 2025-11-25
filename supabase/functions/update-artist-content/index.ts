import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sanitizeFreeText } from "../_shared/sanitization.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Step 1: Authenticate user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authenticatedUserId = user.id;
    console.log('Authenticated user ID:', authenticatedUserId);

    // Step 2: Check if user is admin (authorization)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roleData, error: roleError } = await supabase
      .rpc('has_role', { _user_id: authenticatedUserId, _role: 'admin' });

    if (roleError || !roleData) {
      console.error('Authorization check failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Parse request body
    const { bio_text, description, artwork_id } = await req.json();

    // Validate input
    if (!bio_text && !description) {
      return new Response(
        JSON.stringify({ error: 'At least one field (bio_text or description) must be provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (description && !artwork_id) {
      return new Response(
        JSON.stringify({ error: 'artwork_id is required when updating description' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: any = {};

    // Step 4: Update artist_settings.bio_text if provided
    if (bio_text) {
      // Sanitize the bio_text using our utility
      const sanitizedBio = sanitizeFreeText(bio_text);
      
      console.log('Sanitized bio_text:', sanitizedBio.substring(0, 100));

      const { data: settingsData, error: settingsError } = await supabase
        .from('artist_settings')
        .update({ bio_text: sanitizedBio, updated_at: new Date().toISOString() })
        .select()
        .single();

      if (settingsError) {
        console.error('Failed to update artist_settings:', settingsError);
        throw new Error(`Failed to update bio_text: ${settingsError.message}`);
      }

      results.artist_settings = settingsData;

      // Log audit event for bio update
      await supabase
        .from('audit_logs')
        .insert({
          user_id: authenticatedUserId,
          action: 'ARTIST_BIO_UPDATED',
          resource_id: settingsData.id,
          metadata: { field: 'bio_text' },
        })
        .then(({ error: logError }) => {
          if (logError) console.error('Failed to log bio update:', logError);
        });
    }

    // Step 5: Update artworks.description if provided
    if (description && artwork_id) {
      // Sanitize the description using our utility
      const sanitizedDescription = sanitizeFreeText(description);
      
      console.log('Sanitized description for artwork:', artwork_id);

      const { data: artworkData, error: artworkError } = await supabase
        .from('artworks')
        .update({ description: sanitizedDescription, updated_at: new Date().toISOString() })
        .eq('id', artwork_id)
        .select()
        .single();

      if (artworkError) {
        console.error('Failed to update artwork:', artworkError);
        throw new Error(`Failed to update artwork description: ${artworkError.message}`);
      }

      results.artwork = artworkData;

      // Log audit event for artwork update
      await supabase
        .from('audit_logs')
        .insert({
          user_id: authenticatedUserId,
          action: 'ARTWORK_DESCRIPTION_UPDATED',
          resource_id: artwork_id,
          metadata: { field: 'description', artwork_title: artworkData.title },
        })
        .then(({ error: logError }) => {
          if (logError) console.error('Failed to log artwork update:', logError);
        });
    }

    console.log('Successfully updated artist content');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Content updated successfully',
        data: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in update-artist-content:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
