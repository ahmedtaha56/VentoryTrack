# Supabase Setup - Visual Guide

## 1️⃣ TABLE STRUCTURE - staff_permissions

```
┌─────────────────────────────────────────────────────────┐
│           staff_permissions TABLE                       │
├──────┬──────────────┬─────────────┬──────────────────┤
│  ID  │  user_id     │ feature_key │ can_view/create  │
├──────┼──────────────┼─────────────┼──────────────────┤
│ 1    │ user-abc-123 │ products    │ ✅ 1, 1, 1, 1    │
│ 2    │ user-abc-123 │ stock_in    │ ✅ 1, 1, 0, 0    │
│ 3    │ user-abc-123 │ sales_create│ 0, 0, 0, 0       │
│ 4    │ user-def-456 │ sales_create│ ✅ 1, 1, 0, 0    │
│ 5    │ user-def-456 │ products    │ ✅ 1, 0, 0, 0    │
└──────┴──────────────┴─────────────┴──────────────────┘

Columns:
- id: Primary Key (UUID)
- user_id: Foreign Key (auth.users)
- feature_key: Feature name
- can_view: Boolean
- can_create: Boolean
- can_update: Boolean
- can_delete: Boolean
```

---

## 2️⃣ RPC FUNCTION FLOW

### Function 1: get_user_features()

```
Frontend Request:
┌────────────────────────────────────────┐
│ await supabase.rpc('get_user_features',│
│   { p_user_id: 'user-abc-123' }        │
│ )                                      │
└────────────────┬───────────────────────┘
                 │
                 ▼
Supabase Backend (SQL):
┌────────────────────────────────────────┐
│ SELECT feature_key, can_view, ...      │
│ FROM staff_permissions                 │
│ WHERE user_id = 'user-abc-123'         │
│ ORDER BY feature_key                   │
└────────────────┬───────────────────────┘
                 │
                 ▼
Database Query:
┌────────────────────────────────────────┐
│ Finds 3 matching records               │
│ (products, stock_in, sales_create)     │
└────────────────┬───────────────────────┘
                 │
                 ▼
Frontend Response:
┌────────────────────────────────────────┐
│ [                                      │
│   {                                    │
│     feature_key: 'products',           │
│     can_view: true,                    │
│     can_create: true,                  │
│     can_update: true,                  │
│     can_delete: true                   │
│   },                                   │
│   {                                    │
│     feature_key: 'stock_in',           │
│     can_view: true,                    │
│     can_create: true,                  │
│     can_update: false,                 │
│     can_delete: false                  │
│   },                                   │
│   ...                                  │
│ ]                                      │
└────────────────────────────────────────┘
```

---

### Function 2: update_staff_permission()

```
Frontend Request:
┌────────────────────────────────────────┐
│ await supabase.rpc(                    │
│   'update_staff_permission',           │
│   {                                    │
│     p_user_id: 'user-abc-123',         │
│     p_feature_key: 'sales_create',     │
│     p_can_view: true,                  │
│     p_can_create: true,                │
│     p_can_update: false,               │
│     p_can_delete: false                │
│   }                                    │
│ )                                      │
└────────────────┬───────────────────────┘
                 │
                 ▼
Supabase Backend (PL/pgSQL):
┌────────────────────────────────────────┐
│ 1. Check if record exists               │
│    WHERE user_id = 'user-abc-123'      │
│    AND feature_key = 'sales_create'    │
│                                        │
│ 2. Record exists?                      │
│    YES → UPDATE                        │
│    NO → INSERT                         │
│                                        │
│ 3. Return success JSON                 │
└────────────────┬───────────────────────┘
                 │
                 ▼
Frontend Response:
┌────────────────────────────────────────┐
│ {                                      │
│   success: true,                       │
│   feature_key: 'sales_create',         │
│   message: 'Permission updated...'     │
│ }                                      │
└────────────────────────────────────────┘
```

---

## 3️⃣ COMPLETE DATA FLOW

```
┌─────────────────────────────────────────────────────────────┐
│                      USER LOGIN                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌──────────────────────────┐
         │ signInUser()             │
         │ (database.js)            │
         └────────────┬─────────────┘
                      │
                      ▼
         ┌──────────────────────────┐
         │ getCurrentUser()          │
         │ Fetch user from DB       │
         └────────────┬─────────────┘
                      │
                      ▼
         ┌──────────────────────────┐
         │ AuthContext calls        │
         │ fetchUserPermissions()   │
         └────────────┬─────────────┘
                      │
                      ▼
         ┌──────────────────────────┐
         │ supabase.rpc(            │
         │   'get_user_features',   │
         │   {p_user_id: user.id}   │
         │ )                        │
         └────────────┬─────────────┘
                      │
                      ▼
    ┌────────────────────────────────────┐
    │  Supabase Database                 │
    │  SELECT * FROM staff_permissions   │
    │  WHERE user_id = user.id           │
    └────────────┬───────────────────────┘
                 │
                 ▼
    Returns user permissions array
                 │
                 ▼
    ┌──────────────────────────────────┐
    │ AuthContext.setPermissions(data)  │
    └────────────┬─────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────┐
    │ usePermissions() Hook available  │
    │ throughout app                    │
    └──────────────────────────────────┘
```

---

## 4️⃣ PERMISSION UPDATE FLOW

```
┌─────────────────────────────────────────────────────────┐
│        Staff Management Screen                          │
│ (EditStaffPermissionsScreen.js)                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌──────────────────────────┐
         │ User clicks             │
         │ "Save All Permissions"  │
         └────────────┬─────────────┘
                      │
                      ▼
         ┌──────────────────────────────────┐
         │ Loop through all features:       │
         │ permissions = {                  │
         │   'products': {...},             │
         │   'sales_create': {...},         │
         │   'stock_in': {...}              │
         │ }                                │
         └────────────┬─────────────────────┘
                      │
                      ▼
         ┌──────────────────────────────────┐
         │ For each feature, call RPC:      │
         │                                  │
         │ supabase.rpc(                    │
         │   'update_staff_permission',     │
         │   {                              │
         │     p_user_id: staffId,          │
         │     p_feature_key: 'products',   │
         │     p_can_view: true,            │
         │     p_can_create: true,          │
         │     p_can_update: false,         │
         │     p_can_delete: false          │
         │   }                              │
         │ )                                │
         └────────────┬─────────────────────┘
                      │
                      ▼
    ┌────────────────────────────────────────┐
    │ Supabase Database                      │
    │                                        │
    │ INSERT INTO staff_permissions (...)    │
    │ ON CONFLICT (user_id, feature_key)     │
    │ DO UPDATE SET ... ;                    │
    │                                        │
    │ Returns: { success: true, ... }        │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────────┐
    │ Repeat for all 8+ features           │
    │                                      │
    │ ✅ products                           │
    │ ✅ categories                         │
    │ ✅ suppliers                          │
    │ ✅ stock_in                           │
    │ ✅ stock_out                          │
    │ ✅ sales_create                       │
    │ ✅ sales_view                         │
    │ ✅ reports                            │
    └────────────┬───────────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────────┐
    │ All permissions updated!              │
    │                                      │
    │ Alert.alert(                         │
    │   'Success',                         │
    │   'Permissions updated successfully' │
    │ )                                    │
    │                                      │
    │ navigation.goBack()                  │
    └──────────────────────────────────────┘
```

---

## 5️⃣ PERMISSIONS CHECK ON SCREEN

```
┌──────────────────────────────────────┐
│  Any Screen (e.g., ProductsScreen)   │
└────────────────┬─────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────┐
    │ import { usePermissions } from... │
    │                                  │
    │ const { getFeaturePermissions }  │
    │   = usePermissions()              │
    │                                  │
    │ const perms =                    │
    │   getFeaturePermissions('products')│
    │                                  │
    │ Result: {                        │
    │   canView: true,                 │
    │   canCreate: false,              │
    │   canUpdate: false,              │
    │   canDelete: false               │
    │ }                                │
    └────────────┬─────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────┐
    │ Check permissions:               │
    │                                  │
    │ if (!perms.canView) {            │
    │   return <NotAuthorized />       │
    │ }                                │
    │                                  │
    │ if (perms.canCreate) {           │
    │   show <AddButton />             │
    │ }                                │
    │                                  │
    │ if (perms.canDelete) {           │
    │   show <DeleteButton />          │
    │ }                                │
    └──────────────────────────────────┘
```

---

## 6️⃣ DATABASE RELATIONSHIPS

```
┌─────────────────────────────────────────────────────────┐
│                    auth.users TABLE                     │
│  (Supabase Auth - Automatically Created)                │
├─────────────────────────────────────────────────────────┤
│ id (UUID) - Primary Key                                 │
│ email                                                   │
│ raw_user_meta_data (JSON)                              │
│   └─ role: 'admin' | 'staff' | 'manager' | 'viewer'    │
│   └─ name: string                                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ References
                     │
┌────────────────────▼────────────────────────────────────┐
│              staff_permissions TABLE                    │
│           (Custom - We Create This)                     │
├─────────────────────────────────────────────────────────┤
│ id (UUID)                                               │
│ user_id (UUID) ──→ FOREIGN KEY → auth.users.id         │
│ feature_key (VARCHAR) - Index for faster queries       │
│ can_view, can_create, can_update, can_delete (Boolean) │
│ created_at, updated_at (Timestamps)                    │
└─────────────────────────────────────────────────────────┘
```

---

## 7️⃣ QUICK CHECKLIST

```
Setup Checklist:

☐ 1. Supabase Dashboard open
☐ 2. SQL Editor tab click
☐ 3. DATABASE_SETUP.sql copy-paste
☐ 4. Run SQL script
☐ 5. Check Table exists:
     SELECT * FROM staff_permissions;
☐ 6. Check Functions exist:
     SELECT routine_name FROM information_schema.routines;
☐ 7. Test RPC:
     SELECT * FROM get_user_features('user-id');
☐ 8. App open, test permission assignment
☐ 9. Verify permissions show correctly
☐ 10. Done! ✅
```

---

**Ready to setup?** Go to DATABASE_SETUP.sql file! 🚀
