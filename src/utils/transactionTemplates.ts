import { format } from "date-fns";

interface OrderConfirmationEmailParams {
  clientName: string;
  artworkTitle: string;
  invoiceNumber: string;
  finalSalePrice: string;
  carrierName: string;
  trackingNumber: string;
  shippingDate: Date;
  clientAddress: string;
  invoiceUrl?: string;
  coaUrl?: string;
}

/**
 * Generates the HTML body for order confirmation emails.
 */
export const getOrderConfirmationEmailHtml = ({
  clientName,
  artworkTitle,
  invoiceNumber,
  finalSalePrice,
  carrierName,
  trackingNumber,
  shippingDate,
  clientAddress,
  invoiceUrl,
  coaUrl,
}: OrderConfirmationEmailParams): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Your Order is Confirmed!</h1>
      <p>Dear ${clientName},</p>
      <p>Thank you for your purchase! Your order has been confirmed and is being prepared for shipment.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h2 style="color: #333; margin-top: 0;">Order Details</h2>
        <p><strong>Artwork:</strong> ${artworkTitle}</p>
        <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
        <p><strong>Sale Price:</strong> $${finalSalePrice}</p>
      </div>

      <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h2 style="color: #333; margin-top: 0;">Shipping Information</h2>
        <p><strong>Carrier:</strong> ${carrierName}</p>
        <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
        <p><strong>Shipping Date:</strong> ${format(shippingDate, "PPP")}</p>
        <p><strong>Shipping Address:</strong><br/>${clientAddress.replace(/\n/g, "<br/>")}</p>
      </div>

      ${invoiceUrl ? `<p><a href="${invoiceUrl}" style="color: #0066cc;">Download Invoice</a></p>` : ""}
      ${coaUrl ? `<p><a href="${coaUrl}" style="color: #0066cc;">Download Certificate of Authenticity</a></p>` : ""}

      <p style="margin-top: 30px; color: #666;">If you have any questions, please don't hesitate to contact us.</p>
      <p style="color: #666;">Best regards,<br/>Your Art Gallery Team</p>
    </div>
  `;
};
