-- Add user_id to invoices table to link transactions to authenticated users
ALTER TABLE public.invoices 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);

-- Update RLS policy for users to view their own invoices
CREATE POLICY "Users can view their own invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Keep existing admin policy for full access
-- (Admins can manage all invoices policy already exists)