-- Add files column to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb;

-- Add a comment to describe the column
COMMENT ON COLUMN public.products.files IS 'Array of file objects with url, name, and type';

-- Create an index on the files column for better query performance
CREATE INDEX IF NOT EXISTS idx_products_files ON public.products USING GIN (files);
