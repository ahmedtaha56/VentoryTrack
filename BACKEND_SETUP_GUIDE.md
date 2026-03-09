# Backend Setup Guide - Supabase Configuration

## 📋 Overview

Aapke app mein custom permission system ke liye 3 main components hain:

```
┌─────────────────────────────────────────┐
│     Frontend (React Native App)          │
│  - Staff Management Screen               │
│  - Permission UI                         │
│  - usePermissions Hook                   │
└──────────────┬──────────────────────────┘
               │
        RPC Functions
               │
┌──────────────▼──────────────────────────┐
│         Supabase Backend                 │
│                                          │
│  1. get_user_features RPC                │
│     └─ Fetch user permissions            │
│                                          │
│  2. update_staff_permission RPC          │
│     └─ Update user permissions           │
│                                          │
│  3. staff_permissions Table              │
│     └─ Store permission data             │
└─────────────────────────────────────────┘
```

---

## ✅ STEP-BY-STEP SETUP

### **Step 1: Supabase Project Kholo**
1. https://supabase.com → **Go to Dashboard**
2. Apna project select karo
3. **SQL Editor** tab click karo

### **Step 2: SQL Script Run Karo**

**Option A: Complete SQL Copy-Paste (Recommended)**

1. [DATABASE_SETUP.sql](DATABASE_SETUP.sql) file kholo
2. Sab SQL copy karo
3. Supabase SQL Editor mein paste karo
4. **Run** button click karo ✅

**Option B: Step-by-Step Execute**

```
1. First, create the table
2. Then, create both RPC functions
3. Finally, run verification queries
```

---

## 🗂️ Table Structure Explanation

### **staff_permissions Table**

```sql
CREATE TABLE public.staff_permissions (
  id UUID PRIMARY KEY,              -- Unique record ID
  user_id UUID NOT NULL,            -- Staff member ID (links to auth.users)
  feature_key VARCHAR(50) NOT NULL, -- Feature name (e.g., 'sales_create')
  can_view BOOLEAN,                 -- Can user view this feature?
  can_create BOOLEAN,               -- Can user create/add items?
  can_update BOOLEAN,               -- Can user edit items?
  can_delete BOOLEAN,               -- Can user delete items?
  created_at TIMESTAMP,             -- When record was created
  updated_at TIMESTAMP              -- Last updated timestamp
);
```

### **Sample Data in Table**

```
Staff Member 1 - Inventory Manager:
┌─────────────────────────────────────────────────┐
│ user_id: abc-123                                │
├─────────────────────────────────────────────────┤
│ Feature: products                               │
│   ✅ View    ✅ Create   ✅ Update   ✅ Delete    │
│                                                 │
│ Feature: stock_in                               │
│   ✅ View    ✅ Create   ❌ Update   ❌ Delete    │
│                                                 │
│ Feature: sales_create                           │
│   ❌ View    ❌ Create   ❌ Update   ❌ Delete    │
└─────────────────────────────────────────────────┘

Staff Member 2 - Sales Executive:
┌─────────────────────────────────────────────────┐
│ user_id: def-456                                │
├─────────────────────────────────────────────────┤
│ Feature: sales_create                           │
│   ✅ View    ✅ Create   ❌ Update   ❌ Delete    │
│                                                 │
│ Feature: sales_view                             │
│   ✅ View    ❌ Create   ❌ Update   ❌ Delete    │
│                                                 │
│ Feature: products                               │
│   ✅ View    ❌ Create   ❌ Update   ❌ Delete    │
└─────────────────────────────────────────────────┘
```

---

## 🔧 RPC Functions

### **Function 1: get_user_features()**

**Purpose:** User ke sab permissions fetch karo

```javascript
// Frontend Usage
const { data, error } = await supabase.rpc('get_user_features', {
  p_user_id: 'abc-123'
});

// Returns:
[
  {
    feature_key: 'products',
    can_view: true,
    can_create: true,
    can_update: true,
    can_delete: true
  },
  {
    feature_key: 'stock_in',
    can_view: true,
    can_create: true,
    can_update: false,
    can_delete: false
  },
  // ... more features
]
```

**Backend Implementation:**
```sql
CREATE OR REPLACE FUNCTION get_user_features(p_user_id UUID)
RETURNS TABLE (feature_key, can_view, can_create, can_update, can_delete)
LANGUAGE SQL
AS $$
SELECT feature_key, can_view, can_create, can_update, can_delete
FROM staff_permissions
WHERE user_id = p_user_id
$$;
```

---

### **Function 2: update_staff_permission()**

**Purpose:** Staff member ko specific feature ka permission de/hata do

```javascript
// Frontend Usage
const { data, error } = await supabase.rpc('update_staff_permission', {
  p_user_id: 'abc-123',
  p_feature_key: 'sales_create',
  p_can_view: true,
  p_can_create: true,
  p_can_update: false,
  p_can_delete: false
});

// Returns:
{
  success: true,
  feature_key: 'sales_create',
  message: 'Permission updated successfully'
}
```

**How it works:**
1. Check karo ki record exist karti hai
2. Agar exist karti hai → UPDATE karo
3. Agar nahi → INSERT karo
4. Success message return karo

**Scenario Examples:**

```
Scenario 1: New Staff Member
- Record exist nahi
- INSERT karo
- ✅ Permission create ho jaegi

Scenario 2: Update Existing
- Record exist karti hai
- UPDATE karo
- ✅ Permission update ho jaegi

Scenario 3: Disable Permission
- can_view = false, can_create = false
- UPDATE karo
- ✅ Access remove ho jaegi
```

---

## 🔐 Row Level Security (RLS)

Hum ne RLS policies add kiye hain:

```sql
-- Policy 1: Users can view their own permissions only
-- اپنی ہی permissions دیکھ سکتے ہیں

-- Policy 2: Only Admins can modify permissions
-- صرف Admin کو edit کا حق
```

---

## 🧪 Testing - Setup Verify Karo

### **Test 1: Table Create Hua?**
```sql
SELECT * FROM staff_permissions LIMIT 1;
-- Should return empty table (no error)
```

### **Test 2: Functions Create Hua?**
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public';
-- Should show: get_user_features, update_staff_permission
```

### **Test 3: Manual Insert (Test Data)**
```sql
-- Insert test data
INSERT INTO staff_permissions (user_id, feature_key, can_view, can_create)
VALUES ('test-user-id', 'sales_create', true, true);

-- Fetch it
SELECT * FROM get_user_features('test-user-id');
```

---

## 📱 Frontend Integration

### **In Your App:**

```javascript
// In AuthContext (on login)
const { data, error } = await supabase.rpc('get_user_features', {
  p_user_id: user.id
});

// When admin updates permissions (EditStaffPermissionsScreen)
const { data, error } = await supabase.rpc('update_staff_permission', {
  p_user_id: staffId,
  p_feature_key: 'products',
  p_can_view: true,
  p_can_create: false,
  p_can_update: true,
  p_can_delete: false
});
```

---

## ❓ Troubleshooting

### **Issue 1: "Function not found"**
```
Solution: Verify functions create hua ya nahi
SELECT * FROM information_schema.routines WHERE routine_schema = 'public';
```

### **Issue 2: "Permission denied"**
```
Solution: RLS policies check karo or GRANT command run karo
GRANT EXECUTE ON FUNCTION get_user_features(UUID) TO authenticated;
```

### **Issue 3: "No rows returned"**
```
Solution: Data insert karo pehle
INSERT INTO staff_permissions (...) VALUES (...);
```

---

## 📊 Architecture Summary

```
┌─────────────────────────────────────────────────────────┐
│                    BACKEND FLOW                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. User Login                                          │
│     ↓                                                   │
│  2. AuthContext calls getCurrentUser()                 │
│     ↓                                                   │
│  3. fetchUserPermissions() calls get_user_features()   │
│     ↓                                                   │
│  4. Supabase RPC returns permissions                   │
│     ↓                                                   │
│  5. Store in AuthContext.permissions                   │
│     ↓                                                   │
│  6. usePermissions() hook uses it                       │
│     ↓                                                   │
│  7. Screens check permissions with usePermissions()    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ADMIN UPDATES PERMISSION                              │
│  ↓                                                      │
│  EditStaffPermissionsScreen                            │
│  ↓                                                      │
│  Call update_staff_permission() RPC                    │
│  ↓                                                      │
│  Database INSERT/UPDATE                               │
│  ↓                                                      │
│  Success message + Reload                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Next Steps

1. ✅ [DATABASE_SETUP.sql](DATABASE_SETUP.sql) को Supabase mein run karo
2. ✅ Test karo ke functions work kar rahe hain
3. ✅ App mein permissions update karo
4. ✅ Test permission assignment with EditStaffPermissionsScreen

---

**Questions?** Apna Supabase project URL share karo, help kar doon! 🚀
