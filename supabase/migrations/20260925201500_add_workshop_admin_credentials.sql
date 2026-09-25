-- Add workshop admin credentials to workshops table
ALTER TABLE public.workshops
ADD COLUMN IF NOT EXISTS admin_username TEXT,
ADD COLUMN IF NOT EXISTS admin_password TEXT;
