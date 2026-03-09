# 🔧 TROUBLESHOOTING - Common Errors & Solutions

## ❌ Error 1: "ERROR: 42P13: cannot change return type of existing function"

**What Happened:**
```
You tried to create get_user_features() but it already exists with a different structure
```

**Solution:**
```sql
-- Run this FIRST (cleanup old function):
DROP FUNCTION IF EXISTS get_user_features(UUID) CASCADE;

-- Then run the function creation SQL
CREATE OR REPLACE FUNCTION get_user_features(p_user_id UUID)
...
```

**In QUICK_SETUP.md:**
- नीचे की cleanup query पहले run करो
- फिर पूरी script run करो

---

## ❌ Error 2: "ERROR: 42704: function get_user_features(UUID) does not exist"

**What Happened:**
```
Function creation failed या incomplete हुआ
```

**Solution:**
1. SQL editor खोलो
2. यह query run करो:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
```
3. اگر `get_user_features` नहीं दिख रहा, तो फिर से script run करो

---

## ❌ Error 3: "ERROR: relation "staff_permissions" does not exist"

**What Happened:**
```
Table creation fail हुआ
```

**Solution:**
1. Check करो table exist करता है:
```sql
SELECT * FROM staff_permissions LIMIT 1;
```

2. अगर error आता है, तो:
```sql
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
```

---

## ❌ Error 4: "No rows returned" या "undefined"

**What Happened:**
```
App से RPC call हो रहा है लेकिन कोई data नहीं आ रहा
```

**Solution:**

Step 1: Check करो कि staff_permissions table में data है?
```sql
SELECT * FROM staff_permissions;
```

Step 2: अगर खाली है, तो manually insert करो (test के लिए):
```sql
INSERT INTO staff_permissions (user_id, feature_key, can_view, can_create, can_update, can_delete)
VALUES (
  'YOUR-USER-ID-HERE',
  'products',
  true,
  true,
  false,
  false
);
```

Step 3: Test करो:
```sql
SELECT * FROM get_user_features('YOUR-USER-ID-HERE');
```

---

## ❌ Error 5: "Permission denied" या "insufficient privilege"

**What Happened:**
```
GRANT statement fail हुई
```

**Solution:**
```sql
-- Manually grant permissions:
GRANT EXECUTE ON FUNCTION get_user_features(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_staff_permission(UUID, VARCHAR, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;
```

---

## ❌ Error 6: "user_id cannot be null"

**What Happened:**
```
RPC call करते समय user_id null है
```

**Solution in App:**
```javascript
// सुनिश्चित करो कि user.id valid है
const { data, error } = await supabase.rpc('get_user_features', {
  p_user_id: user?.id  // Check करो यह null नहीं है
});

console.log('user.id:', user?.id);
```

---

## ❌ Error 7: "Foreign key constraint violation"

**What Happened:**
```
User ID staff_permissions में डाली जा रही है जो auth.users में exist नहीं करती
```

**Solution:**
```sql
-- Check करो valid user IDs:
SELECT id, email FROM auth.users LIMIT 5;

-- फिर उसी user_id को use करो
INSERT INTO staff_permissions (user_id, feature_key, ...)
VALUES ('valid-user-id-from-above', ...);
```

---

## ✅ SUCCESS CHECKS

### Check 1: Table Exists?
```sql
SELECT * FROM staff_permissions LIMIT 1;
-- Should return: empty table or existing rows (no error)
```

### Check 2: Functions Exist?
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
-- Should show: get_user_features, update_staff_permission
```

### Check 3: Can Query Functions?
```sql
-- Replace with real user ID
SELECT * FROM get_user_features('abc-123-def-456');
-- Should return: array of permissions (or empty if no data)
```

### Check 4: Can Update Permissions?
```sql
SELECT update_staff_permission(
  'abc-123-def-456',
  'products',
  true,
  true,
  false,
  false
);
-- Should return: {success: true, ...}
```

---

## 🔍 DEBUG CHECKLIST

- [ ] Supabase project logged in?
- [ ] SQL Editor खुला है?
- [ ] Correct project select है?
- [ ] Copy-paste में कोई syntax error?
- [ ] पूरी script ek sath run की?
- [ ] Database में कोई errors दिख रहे?
- [ ] Functions exist करते हैं?
- [ ] Table exist करती है?
- [ ] Test data insert किया?
- [ ] App में correct user ID भेज रहे हो?

---

## 📞 QUICK FIXES

| Problem | Quick Fix |
|---------|-----------|
| Function already exists | `DROP FUNCTION IF EXISTS name(...) CASCADE;` फिर create करो |
| Table doesn't exist | Cleanup + पूरी script फिर से run करो |
| No data returned | Check करो data table में exist करता है |
| RPC not working | Verify करो function names सही हैं |
| Permission error | GRANT statements run करो |
| Null values | Check करो app से सही parameters भेज रहे हो |

---

## 🆘 LAST RESORT - Complete Clean Reset

अगर कुछ भी काम नहीं कर रहा:

```sql
-- ⚠️ WARNING: यह सब delete कर देगा!

DROP TABLE IF EXISTS staff_permissions CASCADE;
DROP FUNCTION IF EXISTS get_user_features(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_staff_permission(UUID, VARCHAR, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) CASCADE;

-- अब पूरी DATABASE_SETUP.sql फिर से run करो
```

फिर DATABASE_SETUP.sql या QUICK_SETUP_SQL.sql पूरी तरह run कर दो।

---

**अभी भी problem है? डिटेल में बताना क्या error दिखा रहा है! 🚀**
