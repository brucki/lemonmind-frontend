-- Add gpsr_additional_safety_info column to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS gpsr_additional_safety_info TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN public.products.gpsr_additional_safety_info IS 'Additional safety information for GPSR compliance';

-- Create a view with the camelCase alias for backward compatibility
CREATE OR REPLACE VIEW public.products_with_aliases AS
SELECT 
    *,
    gpsr_additional_safety_info AS "gpsrAdditionalSafetyInfo"
FROM public.products;

-- Grant permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products_with_aliases TO anon, authenticated, service_role;
