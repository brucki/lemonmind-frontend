-- Add GPSR related columns to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS gpsr_identification_details TEXT,
ADD COLUMN IF NOT EXISTS gpsr_pictograms TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS gpsr_declarations_of_conformity TEXT,
ADD COLUMN IF NOT EXISTS gpsr_certificates TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS gpsr_moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (gpsr_moderation_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS gpsr_moderation_comment TEXT,
ADD COLUMN IF NOT EXISTS gpsr_last_submission_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS gpsr_last_moderation_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS gpsr_submitted_by_supplier_user TEXT;
