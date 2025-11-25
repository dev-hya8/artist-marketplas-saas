-- Create invoices table for storing invoice records
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  artwork_id uuid REFERENCES public.artworks(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_address text NOT NULL,
  sale_date date NOT NULL,
  final_sale_price numeric NOT NULL,
  shipping_cost numeric DEFAULT 0,
  tax_rate numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  pdf_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on invoices table
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Admin can manage all invoices
CREATE POLICY "Admins can manage all invoices"
ON public.invoices
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public can view invoices (for client access via link)
CREATE POLICY "Public can view invoices"
ON public.invoices
FOR SELECT
USING (true);

-- Add payment_terms field to artist_settings for invoice customization
ALTER TABLE public.artist_settings
ADD COLUMN payment_terms text DEFAULT 'Payment due within 30 days of invoice date. Please reference the invoice number on all payments.';

-- Add trigger for invoice updated_at
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for invoice PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for invoice storage bucket
CREATE POLICY "Admins can upload invoices"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'invoices' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update invoices"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'invoices' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Public can view invoices"
ON storage.objects
FOR SELECT
USING (bucket_id = 'invoices');