-- ============================================
-- RPC FUNCTION TO GET ALL SALES FOR REPORTS
-- ============================================
-- Run this SQL in your Supabase SQL editor

DROP FUNCTION IF EXISTS public.get_all_sales_for_period(TIMESTAMP WITH TIME ZONE);

CREATE OR REPLACE FUNCTION public.get_all_sales_for_period(p_start_time TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  total_amount NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  sale_items JSON
)
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.total_amount,
    s.notes,
    s.created_at,
    json_agg(
      json_build_object(
        'product_id', si.product_id,
        'quantity', si.quantity,
        'unit_price', si.unit_price,
        'subtotal', si.subtotal,
        'products', json_build_object(
          'selling_price', p.selling_price,
          'name', p.name
        )
      )
    ) AS sale_items
  FROM public.sales s
  LEFT JOIN public.sale_items si ON s.id = si.sale_id
  LEFT JOIN public.products p ON si.product_id = p.id
  WHERE s.created_at >= p_start_time
  GROUP BY s.id, s.user_id, s.total_amount, s.notes, s.created_at
  ORDER BY s.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_sales_for_period(TIMESTAMP WITH TIME ZONE) TO authenticated;

-- Test the function (replace the date with a past date)
-- SELECT * FROM get_all_sales_for_period('2024-01-01'::TIMESTAMP WITH TIME ZONE);
