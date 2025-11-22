-- Add inbox management columns to inquiries table
ALTER TABLE public.inquiries 
ADD COLUMN status text DEFAULT 'inbox' NOT NULL,
ADD COLUMN is_read boolean DEFAULT false NOT NULL,
ADD COLUMN is_favorite boolean DEFAULT false NOT NULL;

-- Add index for better query performance
CREATE INDEX idx_inquiries_status ON public.inquiries(status);
CREATE INDEX idx_inquiries_is_favorite ON public.inquiries(is_favorite);
CREATE INDEX idx_inquiries_is_read ON public.inquiries(is_read);