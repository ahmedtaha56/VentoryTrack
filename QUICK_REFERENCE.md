# 🎯 QUICK REFERENCE CARD

## 🔴 YOU JUST GOT THIS ERROR:
```
ERROR: 42P13: cannot change return type of existing function
```

## ✅ FIX (2 STEPS):

### Step 1: Run Cleanup SQL (in Supabase SQL Editor)
```sql
DROP TABLE IF EXISTS staff_permissions CASCADE;
DROP FUNCTION IF EXISTS get_user_features(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_staff_permission(UUID, VARCHAR, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) CASCADE;
```

### Step 2: Run Setup SQL
Open [QUICK_SETUP_SQL.sql](QUICK_SETUP_SQL.sql) and copy entire content into Supabase SQL Editor, then click Run.

✅ Done!

---

## 📱 USE IN YOUR SCREENS

```javascript
import { usePermissions } from '../../hooks/usePermissions';

export const YourScreen = () => {
  const { getFeaturePermissions } = usePermissions();
  const { canView, canCreate, canUpdate, canDelete } = 
    getFeaturePermissions('products');  // Change 'products' to your feature

  if (!canView) {
    return <Text>Not Authorized</Text>;
  }

  return (
    <View>
      {canCreate && <Button title="Add" />}
      {canUpdate && <Button title="Edit" />}
      {canDelete && <Button title="Delete" />}
    </View>
  );
};
```

---

## 🎯 Feature Keys
```
'products'      - Product management
'categories'    - Category management
'suppliers'     - Supplier management
'stock_in'      - Stock in operation
'stock_out'     - Stock out operation
'sales_create'  - Create invoices
'sales_view'    - View sales
'sales_delete'  - Delete invoices
'reports'       - Reports
'staff'         - Staff management
'settings'      - Settings
```

---

## 📋 FILES YOU NEED

| What | Where | Action |
|------|-------|--------|
| Setup SQL | [QUICK_SETUP_SQL.sql](QUICK_SETUP_SQL.sql) | Copy & Paste in Supabase |
| Instructions | [QUICK_SETUP.md](QUICK_SETUP.md) | Read & Follow |
| Errors? | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Read & Fix |
| Details? | [SYSTEM_SUMMARY.md](SYSTEM_SUMMARY.md) | Learn Deep |

---

## ⚡ FASTEST ROUTE

```
1. DATABASE got error?
   → Run cleanup SQL (see above)
   → Run QUICK_SETUP_SQL.sql

2. Verify it worked:
   SELECT * FROM staff_permissions LIMIT 1;

3. Test in app:
   → Go to Staff Management
   → Add staff
   → Assign permissions
   → Click Save

4. Done! ✅
```

---

## 🔗 KEY FUNCTIONS

**Frontend:**
```javascript
// Check detailed permissions
const perms = getFeaturePermissions('products');
// { canView: true, canCreate: true, canUpdate: false, canDelete: false }

// Quick checks
const canDo = hasPermission('products', 'create');
const hasAccess = hasFeatureAccess('products');
```

**Backend (RPC Calls):**
```javascript
// Get user permissions
const { data } = await supabase.rpc('get_user_features', {
  p_user_id: userId
});

// Update permission
const { data } = await supabase.rpc('update_staff_permission', {
  p_user_id: staffId,
  p_feature_key: 'products',
  p_can_view: true,
  p_can_create: true,
  p_can_update: false,
  p_can_delete: false
});
```

---

## 🐛 COMMON ISSUES

| Error | Solution |
|-------|----------|
| "Function does not exist" | Run cleanup SQL first, then setup |
| "No data returned" | Check data in table: `SELECT * FROM staff_permissions;` |
| "Permission denied" | Run: `GRANT EXECUTE ON FUNCTION...` |
| App shows no permissions | Check user.id is valid: `console.log(user.id)` |

---

## ✅ SUCCESS SIGNS

- [ ] Cleanup SQL ran without error
- [ ] Setup SQL ran without error
- [ ] Staff Management screen shows "Assign Role" button
- [ ] Can toggle permissions on/off
- [ ] "Save" button works
- [ ] No console errors

---

## 📞 STUCK?

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Verify all SQL ran successfully
3. Check browser console for errors
4. Check Supabase logs for API errors

---

**That's it! Simple, fast, and works! 🚀**
