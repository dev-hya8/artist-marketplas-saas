import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Security Constraint: Retrieve authenticated user ID from JWT token
    // This prevents client-side tampering with user_id
    let authenticatedUserId = null;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader) {
      // Create a client with the user's JWT to verify authentication
      const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
      const userClient = createClient(supabaseUrl, supabaseAnon, {
        global: { headers: { Authorization: authHeader } },
      });
      
      // Retrieve User ID: Get the authenticated user's ID from the session
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      
      if (!authError && user) {
        authenticatedUserId = user.id;
        console.log('Authenticated user ID retrieved:', authenticatedUserId);
      }
    }

    const {
      artworkId,
      clientName,
      clientEmail,
      clientAddress,
      saleDate,
      finalSalePrice,
      shippingCost,
      taxRate,
      // Remove userId from request body - we get it securely from JWT instead
    } = await req.json();

    console.log('Generating invoice for artwork:', artworkId);

    // Fetch artwork details
    const { data: artwork, error: artworkError } = await supabase
      .from('artworks')
      .select('*')
      .eq('id', artworkId)
      .single();

    if (artworkError) throw artworkError;

    // Fetch artist settings
    const { data: artistSettings, error: settingsError } = await supabase
      .from('artist_settings')
      .select('*')
      .single();

    if (settingsError) throw settingsError;

    // Calculate amounts
    const subtotal = parseFloat(finalSalePrice);
    const shipping = parseFloat(shippingCost) || 0;
    const rate = parseFloat(taxRate) || 0;
    const taxAmount = subtotal * (rate / 100);
    const totalAmount = subtotal + shipping + taxAmount;

    // Generate unique invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    const { width, height } = page.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yPosition = height - 60;

    // Header - Invoice Title
    page.drawText('INVOICE', {
      x: 50,
      y: yPosition,
      size: 32,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    yPosition -= 20;
    page.drawText(invoiceNumber, {
      x: 50,
      y: yPosition,
      size: 14,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Date
    const formattedDate = new Date(saleDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    page.drawText(`Date: ${formattedDate}`, {
      x: width - 200,
      y: height - 60,
      size: 12,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });

    yPosition -= 50;

    // Artist Information
    page.drawText('FROM:', {
      x: 50,
      y: yPosition,
      size: 12,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    yPosition -= 20;
    page.drawText(artistSettings.display_name || 'Artist Name', {
      x: 50,
      y: yPosition,
      size: 11,
      font: font,
    });

    if (artistSettings.contact_email) {
      yPosition -= 16;
      page.drawText(artistSettings.contact_email, {
        x: 50,
        y: yPosition,
        size: 11,
        font: font,
      });
    }

    yPosition -= 40;

    // Client Information
    page.drawText('BILL TO:', {
      x: 50,
      y: yPosition,
      size: 12,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    yPosition -= 20;
    page.drawText(clientName, {
      x: 50,
      y: yPosition,
      size: 11,
      font: font,
    });

    yPosition -= 16;
    page.drawText(clientEmail, {
      x: 50,
      y: yPosition,
      size: 11,
      font: font,
    });

    // Split address into lines if too long
    const addressLines = clientAddress.split('\n');
    for (const line of addressLines) {
      yPosition -= 16;
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 11,
        font: font,
      });
    }

    yPosition -= 50;

    // Artwork Details Section
    page.drawText('ARTWORK DETAILS', {
      x: 50,
      y: yPosition,
      size: 12,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    yPosition -= 30;

    // Table header
    page.drawRectangle({
      x: 50,
      y: yPosition - 20,
      width: width - 100,
      height: 25,
      color: rgb(0.95, 0.95, 0.95),
    });

    page.drawText('Title', { x: 60, y: yPosition - 10, size: 10, font: fontBold });
    page.drawText('Medium', { x: 250, y: yPosition - 10, size: 10, font: fontBold });
    page.drawText('Dimensions', { x: 380, y: yPosition - 10, size: 10, font: fontBold });

    yPosition -= 45;

    // Artwork row
    page.drawText(artwork.title || 'Untitled', { x: 60, y: yPosition, size: 10, font: font });
    page.drawText(artwork.medium || 'N/A', { x: 250, y: yPosition, size: 10, font: font });
    page.drawText(artwork.dimensions || 'N/A', { x: 380, y: yPosition, size: 10, font: font });

    yPosition -= 50;

    // Financial Summary
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    yPosition -= 30;

    const rightAlign = width - 150;
    const labelX = width - 250;

    page.drawText('Subtotal:', { x: labelX, y: yPosition, size: 11, font: font });
    page.drawText(`$${subtotal.toFixed(2)}`, { x: rightAlign, y: yPosition, size: 11, font: font });

    yPosition -= 20;
    page.drawText('Shipping:', { x: labelX, y: yPosition, size: 11, font: font });
    page.drawText(`$${shipping.toFixed(2)}`, { x: rightAlign, y: yPosition, size: 11, font: font });

    yPosition -= 20;
    page.drawText(`Tax (${rate}%):`, { x: labelX, y: yPosition, size: 11, font: font });
    page.drawText(`$${taxAmount.toFixed(2)}`, { x: rightAlign, y: yPosition, size: 11, font: font });

    yPosition -= 30;
    page.drawRectangle({
      x: labelX - 10,
      y: yPosition - 5,
      width: 260,
      height: 25,
      color: rgb(0.95, 0.95, 0.95),
    });

    page.drawText('TOTAL DUE:', { x: labelX, y: yPosition, size: 13, font: fontBold });
    page.drawText(`$${totalAmount.toFixed(2)}`, { x: rightAlign, y: yPosition, size: 13, font: fontBold });

    yPosition -= 50;

    // Payment Terms
    if (artistSettings.payment_terms) {
      page.drawText('PAYMENT TERMS', {
        x: 50,
        y: yPosition,
        size: 12,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
      });

      yPosition -= 20;
      const terms = artistSettings.payment_terms;
      const maxWidth = width - 100;
      const words = terms.split(' ');
      let line = '';
      
      for (const word of words) {
        const testLine = line + word + ' ';
        const textWidth = font.widthOfTextAtSize(testLine, 10);
        
        if (textWidth > maxWidth && line !== '') {
          page.drawText(line, { x: 50, y: yPosition, size: 10, font: font });
          line = word + ' ';
          yPosition -= 16;
        } else {
          line = testLine;
        }
      }
      
      if (line !== '') {
        page.drawText(line, { x: 50, y: yPosition, size: 10, font: font });
      }
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = pdfBytes.buffer as ArrayBuffer;
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

    // Upload to storage
    const fileName = `${invoiceNumber}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName);

    const pdfUrl = urlData.publicUrl;

    // Secure Database Insert: Save invoice with authenticated user's ID
    // The user_id comes from the JWT token, not the request body
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        artwork_id: artworkId,
        client_name: clientName,
        client_email: clientEmail,
        client_address: clientAddress,
        sale_date: saleDate,
        final_sale_price: subtotal,
        shipping_cost: shipping,
        tax_rate: rate,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        pdf_url: pdfUrl,
        user_id: authenticatedUserId, // Securely retrieved from JWT, cannot be tampered with
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Invoice save error:', invoiceError);
      throw invoiceError;
    }

    console.log('Invoice generated successfully:', invoiceNumber);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invoice,
        pdfUrl,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});