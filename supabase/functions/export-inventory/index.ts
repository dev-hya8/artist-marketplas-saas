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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { format } = await req.json();

    console.log('Exporting inventory in format:', format);

    // Fetch all artworks
    const { data: artworks, error: artworksError } = await supabase
      .from('artworks')
      .select('*')
      .order('created_at', { ascending: false });

    if (artworksError) throw artworksError;

    // Fetch artist settings
    const { data: artistSettings, error: settingsError } = await supabase
      .from('artist_settings')
      .select('*')
      .single();

    if (settingsError) throw settingsError;

    // Calculate summary statistics
    const totalArtworks = artworks?.length || 0;
    const availableCount = artworks?.filter(a => a.status === 'Available').length || 0;
    const soldCount = artworks?.filter(a => a.status === 'Sold').length || 0;
    const onLoanCount = artworks?.filter(a => a.status === 'On Loan').length || 0;
    const reservedCount = artworks?.filter(a => a.status === 'Reserved').length || 0;

    if (format === 'pdf') {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let currentPage = pdfDoc.addPage([612, 792]); // Letter size
      let yPosition = currentPage.getHeight() - 60;
      const leftMargin = 50;
      const rightMargin = currentPage.getWidth() - 50;

      // Header
      currentPage.drawText('ARTIST INVENTORY REPORT', {
        x: leftMargin,
        y: yPosition,
        size: 24,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      yPosition -= 20;
      const reportDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      currentPage.drawText(`Generated: ${reportDate}`, {
        x: leftMargin,
        y: yPosition,
        size: 11,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });

      yPosition -= 15;
      currentPage.drawText(`Artist: ${artistSettings.display_name || 'Unknown'}`, {
        x: leftMargin,
        y: yPosition,
        size: 11,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });

      yPosition -= 40;

      // Summary statistics
      currentPage.drawText('INVENTORY SUMMARY', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
      });

      yPosition -= 25;

      const summaryData = [
        `Total Artworks: ${totalArtworks}`,
        `Available: ${availableCount}`,
        `Sold: ${soldCount}`,
        `On Loan: ${onLoanCount}`,
        `Reserved: ${reservedCount}`,
      ];

      for (const line of summaryData) {
        currentPage.drawText(line, {
          x: leftMargin,
          y: yPosition,
          size: 11,
          font: font,
          color: rgb(0.3, 0.3, 0.3),
        });
        yPosition -= 18;
      }

      yPosition -= 30;

      // Artwork list header
      currentPage.drawText('ARTWORK INVENTORY', {
        x: leftMargin,
        y: yPosition,
        size: 14,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
      });

      yPosition -= 30;

      // Table header
      currentPage.drawRectangle({
        x: leftMargin,
        y: yPosition - 20,
        width: rightMargin - leftMargin,
        height: 25,
        color: rgb(0.95, 0.95, 0.95),
      });

      currentPage.drawText('Title', { x: leftMargin + 10, y: yPosition - 10, size: 10, font: fontBold });
      currentPage.drawText('Medium', { x: leftMargin + 200, y: yPosition - 10, size: 10, font: fontBold });
      currentPage.drawText('Price', { x: leftMargin + 320, y: yPosition - 10, size: 10, font: fontBold });
      currentPage.drawText('Status', { x: leftMargin + 420, y: yPosition - 10, size: 10, font: fontBold });

      yPosition -= 45;

      // Artwork rows
      for (const artwork of artworks || []) {
        // Check if we need a new page
        if (yPosition < 100) {
          currentPage = pdfDoc.addPage([612, 792]);
          yPosition = currentPage.getHeight() - 60;
        }

        const title = artwork.title || 'Untitled';
        const medium = artwork.medium || 'N/A';
        const price = artwork.price ? `$${artwork.price.toLocaleString()}` : 'N/A';
        const status = artwork.status || 'Unknown';

        // Truncate long titles
        const maxTitleLength = 25;
        const displayTitle = title.length > maxTitleLength 
          ? title.substring(0, maxTitleLength) + '...' 
          : title;

        currentPage.drawText(displayTitle, { 
          x: leftMargin + 10, 
          y: yPosition, 
          size: 10, 
          font: font 
        });
        
        currentPage.drawText(medium, { 
          x: leftMargin + 200, 
          y: yPosition, 
          size: 10, 
          font: font 
        });
        
        currentPage.drawText(price, { 
          x: leftMargin + 320, 
          y: yPosition, 
          size: 10, 
          font: font 
        });
        
        // Status with color
        let statusColor = rgb(0.3, 0.3, 0.3);
        if (status === 'Available') statusColor = rgb(0.13, 0.7, 0.13);
        if (status === 'Sold') statusColor = rgb(0.8, 0.2, 0.2);
        if (status === 'On Loan') statusColor = rgb(0.8, 0.6, 0.0);
        
        currentPage.drawText(status, { 
          x: leftMargin + 420, 
          y: yPosition, 
          size: 10, 
          font: font,
          color: statusColor,
        });

        yPosition -= 25;

        // Optional: Add dimensions and year if available
        if (artwork.dimensions || artwork.creation_year) {
          if (yPosition < 100) {
            currentPage = pdfDoc.addPage([612, 792]);
            yPosition = currentPage.getHeight() - 60;
          }

          const details = [];
          if (artwork.dimensions) details.push(`Dimensions: ${artwork.dimensions}`);
          if (artwork.creation_year) details.push(`Year: ${artwork.creation_year}`);
          
          currentPage.drawText(details.join(' | '), {
            x: leftMargin + 10,
            y: yPosition,
            size: 8,
            font: font,
            color: rgb(0.5, 0.5, 0.5),
          });

          yPosition -= 20;
        }

        yPosition -= 5; // Extra spacing between artworks
      }

      // Save PDF
      const pdfBytes = await pdfDoc.save();
      const pdfBuffer = pdfBytes.buffer as ArrayBuffer;

      return new Response(pdfBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="inventory-report-${Date.now()}.pdf"`,
        },
      });

    } else if (format === 'docx') {
      // Generate DOCX format
      // Using a simplified approach - creating an HTML-based DOCX
      let htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
        <head>
          <meta charset='utf-8'>
          <title>Inventory Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { font-size: 24pt; color: #1a1a1a; margin-bottom: 10px; }
            .meta { font-size: 11pt; color: #666; margin-bottom: 30px; }
            h2 { font-size: 14pt; color: #333; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #ccc; padding-bottom: 5px; }
            .summary { margin-bottom: 30px; }
            .summary p { margin: 5px 0; font-size: 11pt; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f0f0f0; padding: 10px; text-align: left; font-weight: bold; border: 1px solid #ddd; }
            td { padding: 10px; border: 1px solid #ddd; }
            .available { color: #22c55e; font-weight: bold; }
            .sold { color: #ef4444; font-weight: bold; }
            .on-loan { color: #eab308; font-weight: bold; }
            .reserved { color: #6b7280; font-weight: bold; }
            .details { font-size: 9pt; color: #888; }
          </style>
        </head>
        <body>
          <h1>ARTIST INVENTORY REPORT</h1>
          <div class="meta">
            <p>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p>Artist: ${artistSettings.display_name || 'Unknown'}</p>
          </div>

          <h2>INVENTORY SUMMARY</h2>
          <div class="summary">
            <p>Total Artworks: ${totalArtworks}</p>
            <p>Available: ${availableCount}</p>
            <p>Sold: ${soldCount}</p>
            <p>On Loan: ${onLoanCount}</p>
            <p>Reserved: ${reservedCount}</p>
          </div>

          <h2>ARTWORK INVENTORY</h2>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Medium</th>
                <th>Price</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
      `;

      for (const artwork of artworks || []) {
        const title = artwork.title || 'Untitled';
        const medium = artwork.medium || 'N/A';
        const price = artwork.price ? `$${artwork.price.toLocaleString()}` : 'N/A';
        const status = artwork.status || 'Unknown';
        
        let statusClass = '';
        if (status === 'Available') statusClass = 'available';
        if (status === 'Sold') statusClass = 'sold';
        if (status === 'On Loan') statusClass = 'on-loan';
        if (status === 'Reserved') statusClass = 'reserved';

        const details = [];
        if (artwork.dimensions) details.push(`Dimensions: ${artwork.dimensions}`);
        if (artwork.creation_year) details.push(`Year: ${artwork.creation_year}`);
        if (artwork.location) details.push(`Location: ${artwork.location}`);

        htmlContent += `
          <tr>
            <td><strong>${title}</strong></td>
            <td>${medium}</td>
            <td>${price}</td>
            <td class="${statusClass}">${status}</td>
            <td class="details">${details.join('<br>')}</td>
          </tr>
        `;
      }

      htmlContent += `
            </tbody>
          </table>
        </body>
        </html>
      `;

      // Convert to DOCX-compatible format
      const docxBytes = new TextEncoder().encode(htmlContent);

      return new Response(docxBytes, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="inventory-report-${Date.now()}.docx"`,
        },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid format. Use "pdf" or "docx".' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error exporting inventory:', error);
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