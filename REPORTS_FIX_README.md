# Reports Screen Fix - Admin View All Sales

## Problem
Admin users were only seeing the top selling products from their own sales, not from all staff members.

## Solution
The fix involves two parts:

### 1. Code Changes (Already Done ✅)
- Updated `fetchReportData()` function in [lib/database.js](lib/database.js)
- Admin users now see ALL sales from all team members
- Staff users continue to see only their own sales
- Added "Total Units" display to show exact units sold per product for daily/weekly/monthly views

### 2. Database Setup (NEEDS TO BE DONE ⚠️)
Run this SQL in your Supabase SQL Editor to create the RPC function:

**File:** `ADD_RPC_FUNCTION.sql`

```sql
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

GRANT EXECUTE ON FUNCTION public.get_all_sales_for_period(TIMESTAMP WITH TIME ZONE) TO authenticated;
```

## How to Apply
1. Copy the SQL from `ADD_RPC_FUNCTION.sql`
2. Go to Supabase Dashboard → SQL Editor
3. Paste and run the SQL
4. Done! ✅

## What Changed in the App
- `fetchReportData()` now checks if user is admin
- If admin: fetches ALL sales using the RPC function
- If staff: fetches only their own sales
- Reports screen now displays "Total Units: X" for each product

## Testing
1. Login as admin
2. Go to Reports
3. Click on Daily/Weekly/Monthly
4. You should now see all products sold by your entire team
5. Each product shows the total units sold by everyone

---

## Related: Real-time Team Dashboard

A similar fix has been applied to the main dashboard to make it real-time and show data for the entire team.

This was achieved by creating a new RPC function `get_team_dashboard_data`. The SQL for this function can be found in the file `TEAM_DASHBOARD.sql`.

This ensures that both the Reports and the Dashboard provide a consistent, team-wide view for admin users.
