-- ==========================================
-- FIX: Enable RLS for Categories Table
-- ==========================================
-- Copy and paste this in Supabase SQL Editor

-- Enable RLS on categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete categories" ON public.categories;

-- Policy 1: All authenticated users can VIEW all categories
CREATE POLICY "Users can view all categories"
ON public.categories FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy 2: Users with categories create permission can INSERT
CREATE POLICY "Users can insert categories"
ON public.categories FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND 
  auth.uid() = user_id AND (
    -- Check staff_permissions - if user has create permission for categories
    EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'categories' 
      AND can_create = true
    )
    OR
    -- If no staff permission record exists, allow (means user is admin with full access)
    NOT EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'categories'
    )
  )
);

-- Policy 3: Users with categories update permission can UPDATE
CREATE POLICY "Users can update categories"
ON public.categories FOR UPDATE
USING (
  auth.role() = 'authenticated' AND (
    -- Staff with explicit category update permission
    EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'categories' 
      AND can_update = true
    )
    OR
    -- If no staff permission record exists, allow (means user is admin)
    NOT EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'categories'
    )
  )
)
WITH CHECK (
  auth.role() = 'authenticated' AND (
    -- Staff with explicit category update permission
    EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'categories' 
      AND can_update = true
    )
    OR
    -- If no staff permission record exists, allow (means user is admin)
    NOT EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'categories'
    )
  )
);

-- Policy 4: Users with categories delete permission can DELETE
CREATE POLICY "Users can delete categories"
ON public.categories FOR DELETE
USING (
  auth.role() = 'authenticated' AND (
    -- Staff with explicit category delete permission
    EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'categories' 
      AND can_delete = true
    )
    OR
    -- If no staff permission record exists, allow (means user is admin)
    NOT EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'categories'
    )
  )
);


-- ==========================================
-- FIX: Enable RLS for Suppliers Table
-- ==========================================

-- Enable RLS on suppliers table
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can delete suppliers" ON public.suppliers;

-- Policy 1: All authenticated users can VIEW all suppliers
CREATE POLICY "Users can view all suppliers"
ON public.suppliers FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy 2: Users with suppliers create permission can INSERT
CREATE POLICY "Users can insert suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND 
  auth.uid() = user_id AND (
    -- Check staff_permissions - if user has create permission for suppliers
    EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'suppliers' 
      AND can_create = true
    )
    OR
    -- If no staff permission record exists, allow (means user is admin)
    NOT EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'suppliers'
    )
  )
);

-- Policy 3: Users with suppliers update permission can UPDATE
CREATE POLICY "Users can update suppliers"
ON public.suppliers FOR UPDATE
USING (
  auth.role() = 'authenticated' AND (
    -- Staff with explicit supplier update permission
    EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'suppliers' 
      AND can_update = true
    )
    OR
    -- If no staff permission record exists, allow (means user is admin)
    NOT EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'suppliers'
    )
  )
)
WITH CHECK (
  auth.role() = 'authenticated' AND (
    -- Staff with explicit supplier update permission
    EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'suppliers' 
      AND can_update = true
    )
    OR
    -- If no staff permission record exists, allow (means user is admin)
    NOT EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'suppliers'
    )
  )
);

-- Policy 4: Users with suppliers delete permission can DELETE
CREATE POLICY "Users can delete suppliers"
ON public.suppliers FOR DELETE
USING (
  auth.role() = 'authenticated' AND (
    -- Staff with explicit supplier delete permission
    EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'suppliers' 
      AND can_delete = true
    )
    OR
    -- If no staff permission record exists, allow (means user is admin)
    NOT EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'suppliers'
    )
  )
);


-- ==========================================
-- FIX: Enable RLS for Products Table
-- ==========================================

-- Enable RLS on products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all products" ON public.products;
DROP POLICY IF EXISTS "Users can insert products" ON public.products;
DROP POLICY IF EXISTS "Users can update products" ON public.products;
DROP POLICY IF EXISTS "Users can delete products" ON public.products;

-- Policy 1: All authenticated users can VIEW all products
CREATE POLICY "Users can view all products"
ON public.products FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy 2: Users with products create permission can INSERT
CREATE POLICY "Users can insert products"
ON public.products FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND 
  auth.uid() = user_id AND (
    -- Check staff_permissions - if user has create permission for products
    EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'products' 
      AND can_create = true
    )
    OR
    -- If no staff permission record exists, allow (means user is admin)
    NOT EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'products'
    )
  )
);

-- Policy 3: Users with products update permission can UPDATE
CREATE POLICY "Users can update products"
ON public.products FOR UPDATE
USING (
  auth.role() = 'authenticated' AND (
    -- Staff with explicit products update permission
    EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'products' 
      AND can_update = true
    )
    OR
    -- If no staff permission record exists, allow (means user is admin)
    NOT EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'products'
    )
  )
)
WITH CHECK (
  auth.role() = 'authenticated' AND (
    -- Staff with explicit products update permission
    EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'products' 
      AND can_update = true
    )
    OR
    -- If no staff permission record exists, allow (means user is admin)
    NOT EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'products'
    )
  )
);

-- Policy 4: Users with products delete permission can DELETE
CREATE POLICY "Users can delete products"
ON public.products FOR DELETE
USING (
  auth.role() = 'authenticated' AND (
    -- Staff with explicit products delete permission
    EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'products' 
      AND can_delete = true
    )
    OR
    -- If no staff permission record exists, allow (means user is admin)
    NOT EXISTS (
      SELECT 1 FROM public.staff_permissions 
      WHERE user_id = auth.uid() 
      AND feature_key = 'products'
    )
  )
);
