-- Add timings column to public.website_settings table if it doesn't exist
ALTER TABLE public.website_settings ADD COLUMN IF NOT EXISTS timings TEXT DEFAULT '9:00 AM to 4:00 PM';
