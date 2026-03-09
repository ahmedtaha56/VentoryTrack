CREATE OR REPLACE FUNCTION get_team_dashboard_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'totalProducts', (SELECT COUNT(*) FROM products),
        'lowStockCount', (SELECT COUNT(*) FROM products WHERE quantity <= low_stock_alert),
        'todaysSales', (SELECT COUNT(*) FROM sales WHERE created_at >= date_trunc('day', NOW())),
        'monthlySales', (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE created_at >= date_trunc('month', NOW())),
        'topProducts', (
            SELECT COALESCE(json_agg(p), '[]'::json)
            FROM (
                SELECT
                    p.id,
                    p.name,
                    p.quantity,
                    SUM(si.quantity) AS "totalSold"
                FROM sales s
                JOIN sale_items si ON s.id = si.sale_id
                JOIN products p ON si.product_id = p.id
                WHERE s.created_at >= date_trunc('month', NOW())
                GROUP BY p.id, p.name, p.quantity
                ORDER BY "totalSold" DESC
                LIMIT 5
            ) p
        ),
        'recentSales', (
            SELECT COALESCE(json_agg(s), '[]'::json)
            FROM (
                SELECT
                    s.id,
                    s.notes->>'invoiceNumber' as "invoiceNumber",
                    s.notes->>'customerName' as "customerName",
                    s.created_at as "date",
                    s.total_amount as "total"
                FROM sales s
                ORDER BY s.created_at DESC
                LIMIT 5
            ) s
        ),
        'notifications', (
            SELECT COALESCE(json_agg(n), '[]'::json)
            FROM (
                SELECT
                    id,
                    message,
                    type,
                    product_id
                FROM (
                    SELECT
                        'low-stock-' || p.id AS id,
                        p.name || ' is low on stock (' || p.quantity || ' remaining).' AS message,
                        'low-stock' AS type,
                        p.id as product_id,
                        ROW_NUMBER() OVER(ORDER BY p.quantity ASC) as rn
                    FROM products p
                    WHERE p.quantity <= p.low_stock_alert
                ) as low_stock_notifications
                WHERE rn <= 3
            ) n
        )
    ) INTO result;

    RETURN result;
END;
$$;
