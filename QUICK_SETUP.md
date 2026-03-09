# ⚡ QUICK SETUP - 5 MINUTE GUIDE

## 🎯 Goal
Supabase mein permissions system setup karo - Khatam!

---

## ✅ STEP-BY-STEP (Copy-Paste करो)

### **STEP 1: Supabase खोलो**
```
1. https://supabase.com जाओ
2. Dashboard में अपना project select करो
3. बाईं ओर "SQL Editor" click करो

⚠️ अगर पहले कभी setup किया है:
   - पहले यह run करो:
     DROP TABLE IF EXISTS staff_permissions CASCADE;
     DROP FUNCTION IF EXISTS get_user_features(UUID) CASCADE;
     DROP FUNCTION IF EXISTS update_staff_permission(UUID, VARCHAR, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) CASCADE;
   - फिर नीचे की script run करो
```

---

### **STEP 2: SQL Script Run करो**

**पहले Check करो - पहले कभी setup किया था?**

अगर पहले कभी setup किया था, यह query पहले run करो (CLEANUP):
```sql
DROP TABLE IF EXISTS staff_permissions CASCADE;
DROP FUNCTION IF EXISTS get_user_features(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_staff_permission(UUID, VARCHAR, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) CASCADE;
```

फिर नीचे की **पूरी SQL script copy करो:**

```sql
-- ==========================================
-- TABLE CREATION
-- ==========================================

CREATE TABLE IF NOT EXISTS public.staff_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key VARCHAR(50) NOT NULL,
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_update BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_staff_permissions_user_id 
ON public.staff_permissions(user_id);

CREATE INDEX IF NOT EXISTS idx_staff_permissions_feature_key 
ON public.staff_permissions(feature_key);

ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RPC FUNCTION 1: GET USER FEATURES
-- ==========================================

CREATE OR REPLACE FUNCTION get_user_features(p_user_id UUID)
RETURNS TABLE (
  feature_key VARCHAR,
  feature_name VARCHAR,
  can_view BOOLEAN,
  can_create BOOLEAN,
  can_update BOOLEAN,
  can_delete BOOLEAN
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
SELECT 
  sp.feature_key,
  sp.feature_key as feature_name,
  sp.can_view,
  sp.can_create,
  sp.can_update,
  sp.can_delete
FROM public.staff_permissions sp
WHERE sp.user_id = p_user_id
ORDER BY sp.feature_key;
$$;

GRANT EXECUTE ON FUNCTION get_user_features(UUID) TO authenticated;

-- ==========================================
-- RPC FUNCTION 2: UPDATE STAFF PERMISSION
-- ==========================================

CREATE OR REPLACE FUNCTION update_staff_permission(
  p_user_id UUID,
  p_feature_key VARCHAR,
  p_can_view BOOLEAN,
  p_can_create BOOLEAN,
  p_can_update BOOLEAN,
  p_can_delete BOOLEAN
)
RETURNS JSON
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  result_data JSON;
BEGIN
  INSERT INTO public.staff_permissions (
    user_id,
    feature_key,
    can_view,
    can_create,
    can_update,
    can_delete,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_feature_key,
    p_can_view,
    p_can_create,
    p_can_update,
    p_can_delete,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, feature_key)
  DO UPDATE SET
    can_view = p_can_view,
    can_create = p_can_create,
    can_update = p_can_update,
    can_delete = p_can_delete,
    updated_at = NOW();

  SELECT json_build_object(
    'success', true,
    'feature_key', p_feature_key,
    'message', 'Permission updated successfully'
  ) INTO result_data;

  RETURN result_data;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION update_staff_permission(UUID, VARCHAR, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;
```

**Supabase में क्या करो:**
1. ऊपर की SQL copy करो
2. SQL Editor में paste करो
3. **"Run" button** क्लिक करो (नीचे दाईं ओर)
4. ✅ तैयार!

---

### **STEP 2.5: Team Dashboard Setup करो**
Dashboard ko real-time aur team-wide banane ke liye, yeh SQL function zaroori hai.

**SQL file `TEAM_DASHBOARD.sql` se code copy karo aur Supabase SQL Editor mein run karo.**

```sql
-- TEAM_DASHBOARD.sql ka content yahan paste karein
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
```
**Supabase में क्या करो:**
1. ऊपर की SQL copy करो
2. SQL Editor में paste करो
3. **"Run" button** क्लिक करो
4. ✅ Dashboard ab team-wide data dikhayega!

---

### **STEP 3: Verify करो (चेक करो सब ठीक है)**

```sql
-- TABLE EXISTS?
SELECT * FROM staff_permissions LIMIT 1;
-- Expected: Empty table (no error)

-- FUNCTIONS EXISTS?
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
-- Expected: Should list get_user_features और update_staff_permission
```

---

## 📱 APP में USE करो

### **Example 1: नया Staff Member + Permissions**

```javascript
// EditStaffPermissionsScreen.js में यह automatically काम करेगा

// User permissions को edit करो:
const { data, error } = await supabase.rpc('update_staff_permission', {
  p_user_id: staffMemberId,
  p_feature_key: 'sales_create',
  p_can_view: true,
  p_can_create: true,
  p_can_update: false,
  p_can_delete: false
});

// Success!
// अब यह staff member को सिर्फ "Sales Invoice Create" करने दो
```

### **Example 2: किसी Screen में Permission Check करो**

```javascript
import { usePermissions } from '../../hooks/usePermissions';

export const ProductsScreen = () => {
  const { getFeaturePermissions } = usePermissions();
  const perms = getFeaturePermissions('products');

  if (!perms.canView) {
    return <Text>❌ Access Denied</Text>;
  }

  return (
    <View>
      {perms.canCreate && <Button title="+ Add Product" />}
      {perms.canDelete && <Button title="Delete" />}
    </View>
  );
};
```

---

## 🎓 कैसे काम करता है?

```
1️⃣ Staff Member को Role दो
   ↓
2️⃣ Admin उसे Permissions assign करे
   ↓
3️⃣ Permissions database में save होते हैं
   ↓
4️⃣ App login करते समय permissions fetch होती हैं
   ↓
5️⃣ usePermissions() hook से permission check करो
   ↓
6️⃣ Screen दिखा या छिपा सकते हो
```

---

## 🔥 Database में क्या Store होगा?

```
staff_permissions Table में:

user_id: 'abc-123' (Staff Member की ID)
feature_key: 'sales_create'
can_view: true
can_create: true
can_update: false
can_delete: false

┌──────────────────────────────────────┐
│  Results: यह staff सिर्फ              │
│  ✅ Invoice देख सकता है              │
│  ✅ Invoice बना सकता है              │
│  ❌ Invoice edit नहीं कर सकता       │
│  ❌ Invoice delete नहीं कर सकता     │
└──────────────────────────────────────┘
```

---

## ❌ अगर Error आे तो?

| Error | Solution |
|-------|----------|
| "Function not found" | SQL script फिर से run करो |
| "Permission denied" | Supabase में Authenticated user से run करो |
| "No rows returned" | पहले कुछ test data insert करो |

---

## ✨ तैयार हो गए?

1. ✅ DATABASE_SETUP.sql run कर दो
2. ✅ App में test कर दो
3. ✅ Staff Member को permissions दो
4. ✅ Done! 🎉

---

**Questions?** Mujhe बताना! 🚀
