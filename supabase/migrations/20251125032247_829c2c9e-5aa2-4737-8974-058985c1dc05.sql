-- Add shipping and COA fields to invoices table
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS carrier_name TEXT,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS shipping_date DATE,
ADD COLUMN IF NOT EXISTS coa_url TEXT,
ADD COLUMN IF NOT EXISTS transaction_status TEXT DEFAULT 'draft';

-- Add comment for documentation
COMMENT ON COLUMN public.invoices.carrier_name IS 'Name of the shipping carrier (e.g., FedEx, UPS, DHL)';
COMMENT ON COLUMN public.invoices.tracking_number IS 'Tracking number for the shipment';
COMMENT ON COLUMN public.invoices.shipping_date IS 'Date when the artwork was shipped';
COMMENT ON COLUMN public.invoices.coa_url IS 'URL to the Certificate of Authenticity document';
COMMENT ON COLUMN public.invoices.transaction_status IS 'Status of the transaction workflow (draft, invoice_generated, coa_generated, shipped, completed)';