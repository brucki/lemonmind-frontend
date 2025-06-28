-- Dodaj brakujące kolumny do tabeli products
ALTER TABLE public.products
-- Kolumny GPSR
ADD COLUMN IF NOT EXISTS gpsr_warning_phrases TEXT,
ADD COLUMN IF NOT EXISTS gpsr_warning_text TEXT,
ADD COLUMN IF NOT EXISTS gpsr_statement_of_compliance BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gpsr_additional_safety_info TEXT,
ADD COLUMN IF NOT EXISTS gpsr_online_instructions_url TEXT,
-- Inne brakujące kolumny
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) NOT NULL DEFAULT 0,
-- Kolumny do przechowywania istniejących plików GPSR
ADD COLUMN IF NOT EXISTS existing_gpsr_pictograms TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS existing_gpsr_declarations_of_conformity TEXT[] DEFAULT '{}'::TEXT[],
ADD COLUMN IF NOT EXISTS existing_gpsr_certificates TEXT[] DEFAULT '{}'::TEXT[];
