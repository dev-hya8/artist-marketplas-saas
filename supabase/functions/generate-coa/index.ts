import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      artworkId,
      clientName,
      invoiceNumber,
      saleDate,
      format = 'pdf'
    } = await req.json();

    console.log('Generating COA for artwork:', artworkId);

    // Fetch artwork details
    const { data: artwork, error: artworkError } = await supabaseClient
      .from('artworks')
      .select('*')
      .eq('id', artworkId)
      .single();

    if (artworkError || !artwork) {
      throw new Error('Artwork not found');
    }

    // Fetch artist settings
    const { data: artistSettings } = await supabaseClient
      .from('artist_settings')
      .select('display_name, artist_statement, contact_email')
      .maybeSingle();

    const artistName = artistSettings?.display_name || 'Artist';
    const artistEmail = artistSettings?.contact_email || '';

    // Generate COA content
    const coaContent = {
      title: "CERTIFICATE OF AUTHENTICITY",
      artworkTitle: artwork.title,
      artist: artistName,
      medium: artwork.medium || 'Mixed Media',
      dimensions: artwork.dimensions || 'N/A',
      creationYear: artwork.creation_year || new Date().getFullYear(),
      certificateNumber: `COA-${invoiceNumber}`,
      issuedDate: saleDate,
      collector: clientName,
      description: artwork.description || '',
      provenance: `Original work by ${artistName}. Sold directly by the artist on ${saleDate}.`,
      artistSignature: artistName,
      contactEmail: artistEmail,
    };

    // For now, we'll create a simple text-based document
    // In production, you'd use a PDF generation library
    const coaText = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    CERTIFICATE OF AUTHENTICITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Certificate No: ${coaContent.certificateNumber}
Issue Date: ${coaContent.issuedDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ARTWORK DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Title: ${coaContent.artworkTitle}
Artist: ${coaContent.artist}
Year of Creation: ${coaContent.creationYear}
Medium: ${coaContent.medium}
Dimensions: ${coaContent.dimensions}

Description:
${coaContent.description}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    AUTHENTICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is to certify that the artwork described above is an 
original work created by ${coaContent.artist}.

Provenance:
${coaContent.provenance}

Collector: ${coaContent.collector}

This certificate confirms the authenticity and originality 
of the artwork. It should be kept with the artwork and 
transferred with it in the event of sale or transfer.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Artist: ${coaContent.artistSignature}
Contact: ${coaContent.contactEmail}

Date: ${coaContent.issuedDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    // Generate filename
    const timestamp = Date.now();
    const filename = `coa-${invoiceNumber}-${timestamp}.txt`;
    const filePath = `${artworkId}/${filename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('invoices')
      .upload(filePath, coaText, {
        contentType: 'text/plain',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabaseClient
      .storage
      .from('invoices')
      .getPublicUrl(filePath);

    console.log('COA generated successfully:', urlData.publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        coaUrl: urlData.publicUrl,
        certificateNumber: coaContent.certificateNumber,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error generating COA:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to generate COA',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});