-- Add the category_id column to the products table

-- Add the column
ALTER TABLE products
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Add a comment to describe the column
COMMENT ON COLUMN products.category_id IS 'References the categories table';
