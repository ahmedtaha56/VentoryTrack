# 📚 COMPLETE PERMISSION SYSTEM - SUMMARY

## 🎯 आपका Goal
Staff members को specific features access दो. कोई सिर्फ "Sales Invoice" बना सके, कोई सिर्फ "Products" manage कर सके।

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│               YOUR INVENTORY APP                        │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Frontend (React Native)                         │  │
│  │  - Staff Management Screen                       │  │
│  │  - Permission Assignment UI                      │  │
│  │  - usePermissions Hook                           │  │
│  │  - Feature Permission Checks                     │  │
│  └──────────────────────────────────────────────────┘  │
│                      │                                  │
│         Supabase RPC API Calls                         │
│                      │                                  │
│  ┌──────────────────▼──────────────────────────────┐  │
│  │    Supabase Backend (PostgreSQL)                │  │
│  │                                                 │  │
│  │  1. staff_permissions TABLE                     │  │
│  │     └─ Store permission data                    │  │
│  │                                                 │  │
│  │  2. get_user_features() RPC                     │  │
│  │     └─ Fetch permissions                        │  │
│  │                                                 │  │
│  │  3. update_staff_permission() RPC               │  │
│  │     └─ Update/Create permissions                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🗂️ 3 Backend Components

### **1. staff_permissions Table**

```sql
CREATE TABLE staff_permissions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  feature_key VARCHAR(50),
  can_view BOOLEAN,
  can_create BOOLEAN,
  can_update BOOLEAN,
  can_delete BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Purpose:** Staff members की permissions को database में store करना

**Example Data:**
```
user_id: 'user-123'
feature_key: 'sales_create'
can_view: true
can_create: true
can_update: false
can_delete: false
```

---

### **2. get_user_features() RPC**

```sql
CREATE FUNCTION get_user_features(p_user_id UUID)
RETURNS TABLE (feature_key, can_view, can_create, can_update, can_delete)
AS $$
SELECT ... FROM staff_permissions WHERE user_id = p_user_id
$$
```

**Purpose:** User की सभी permissions को database से लाना

**Frontend Usage:**
```javascript
const { data } = await supabase.rpc('get_user_features', {
  p_user_id: userId
});
// Returns: [{feature_key: 'sales_create', can_view: true, ...}, ...]
```

**कब Call होता है:**
- User login करते समय
- App start होता है
- AuthContext में permissions set होती हैं

---

### **3. update_staff_permission() RPC**

```sql
CREATE FUNCTION update_staff_permission(
  p_user_id UUID,
  p_feature_key VARCHAR,
  p_can_view BOOLEAN,
  p_can_create BOOLEAN,
  p_can_update BOOLEAN,
  p_can_delete BOOLEAN
)
RETURNS JSON
AS $$
INSERT INTO staff_permissions (...)
ON CONFLICT (user_id, feature_key) DO UPDATE
$$
```

**Purpose:** Permissions को create या update करना

**Frontend Usage:**
```javascript
const { data } = await supabase.rpc('update_staff_permission', {
  p_user_id: staffId,
  p_feature_key: 'products',
  p_can_view: true,
  p_can_create: true,
  p_can_update: false,
  p_can_delete: false
});
// Returns: {success: true, ...}
```

**कब Call होता है:**
- EditStaffPermissionsScreen में "Save" button click करते समय
- Admin किसी staff का permission change करता है

---

## 📱 Frontend Components

### **1. StaffManagementScreen.js**
```
┌────────────────────────────────┐
│  Staff Management Screen       │
├────────────────────────────────┤
│                                │
│  [Search Bar]                  │
│                                │
│  ┌──────────────────────────┐  │
│  │ Staff Member 1           │  │
│  │ email@example.com        │  │
│  │ 🔵 Role: Staff           │  │
│  │ [Assign Role Button]     │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ Staff Member 2           │  │
│  │ user@example.com         │  │
│  │ 🟢 Role: Manager         │  │
│  │ [Assign Role Button]     │  │
│  └──────────────────────────┘  │
│                                │
│  [+ Add New Staff FAB]         │
│                                │
└────────────────────────────────┘

कार्य:
- सभी staff members दिखाना
- नए staff जोड़ना
- Role assign करना
```

### **2. EditStaffPermissionsScreen.js**
```
┌────────────────────────────────┐
│  Permissions for John Doe      │
├────────────────────────────────┤
│                                │
│  ℹ️ Permission Info             │
│  "Toggle permissions to grant  │
│   or restrict access..."       │
│                                │
│  📦 INVENTORY MANAGEMENT       │
│  ├─ Products                   │
│  │  ┌─ View: ✓                 │
│  │  ┌─ Create: ✓               │
│  │  ┌─ Update: ✗               │
│  │  ┌─ Delete: ✗               │
│  ├─ Stock In                   │
│  │  ┌─ View: ✓                 │
│  │  ┌─ Create: ✓               │
│  │  ┌─ Update: ✗               │
│  │  ┌─ Delete: ✗               │
│                                │
│  💰 SALES & INVOICING          │
│  ├─ Create Invoice             │
│  │  ┌─ View: ✓                 │
│  │  ┌─ Create: ✓               │
│  │  ┌─ Update: ✗               │
│  │  ┌─ Delete: ✗               │
│                                │
│  [Save All Permissions Button] │
│                                │
└────────────────────────────────┘

कार्य:
- सभी features दिखाना
- Categories में organize करना
- Individual permissions toggle करना
- Database में save करना
```

### **3. usePermissions() Hook**
```javascript
const { getFeaturePermissions, hasPermission } = usePermissions();

// Detailed permissions
const perms = getFeaturePermissions('products');
// {canView: true, canCreate: true, canUpdate: false, canDelete: false}

// Quick check
const canCreate = hasPermission('products', 'create');
// true या false
```

---

## 🔄 Data Flow

### **पहली बार जब User Log In करता है:**
```
1. Login credentials भेजो
   ↓
2. signInUser() call हो (database.js)
   ↓
3. getCurrentUser() से user data fetch हो
   ↓
4. AuthContext में setupUserContext() call हो
   ↓
5. fetchUserPermissions(user.id) call हो
   ↓
6. supabase.rpc('get_user_features', {p_user_id: user.id})
   ↓
7. Database से सभी permissions आएं
   ↓
8. AuthContext में permissions store हो
   ↓
9. usePermissions() hook accessible हो
```

### **जब Admin Permissions Update करता है:**
```
1. EditStaffPermissionsScreen खुले
   ↓
2. Admin permission toggles को change करे
   ↓
3. "Save All Permissions" button दबाए
   ↓
4. Loop through all features:
   FOR each feature:
     supabase.rpc('update_staff_permission', {...})
   ↓
5. Database में INSERT या UPDATE हो
   ↓
6. Success alert दिखे
   ↓
7. Back to staff list
```

### **जब Screen पर Permission Check हो:**
```
1. Any screen में:
   const { getFeaturePermissions } = usePermissions()
   ↓
2. const perms = getFeaturePermissions('products')
   ↓
3. Check करो:
   if (!perms.canView) return <NotAuthorized />
   if (perms.canCreate) show <AddButton />
   if (perms.canDelete) show <DeleteButton />
   ↓
4. Screen accordingly render करो
```

---

## 🎯 Features (Permissions Items)

```
1. products
   └─ Products को manage करना (View, Create, Update, Delete)

2. categories
   └─ Categories manage करना

3. suppliers
   └─ Suppliers manage करना

4. stock_in
   └─ Stock add करना (View, Create)

5. stock_out
   └─ Stock remove करना (View, Create)

6. sales_create
   └─ Sales invoice बनाना (View, Create)

7. sales_view
   └─ Sales history देखना (View only)

8. sales_delete
   └─ Sales invoice delete करना (Delete only)

9. reports
   └─ Reports देखना (View only)

10. staff
    └─ Staff manage करना (View, Create, Update, Delete)

11. settings
    └─ App settings (View, Update)
```

---

## 📊 Example Permission Sets

### **Type 1: Sales Executive**
```
sales_create      ✅ View  ✅ Create  ❌ Update  ❌ Delete
sales_view        ✅ View  ❌ Create  ❌ Update  ❌ Delete
products          ✅ View  ❌ Create  ❌ Update  ❌ Delete
categories        ✅ View  ❌ Create  ❌ Update  ❌ Delete
stock_out         ❌ View  ❌ Create  ❌ Update  ❌ Delete
... other features disabled
```

### **Type 2: Inventory Manager**
```
products          ✅ View  ✅ Create  ✅ Update  ✅ Delete
categories        ✅ View  ✅ Create  ✅ Update  ✅ Delete
suppliers         ✅ View  ✅ Create  ✅ Update  ✅ Delete
stock_in          ✅ View  ✅ Create  ✅ Update  ❌ Delete
stock_out         ✅ View  ✅ Create  ✅ Update  ❌ Delete
sales_view        ✅ View  ❌ Create  ❌ Update  ❌ Delete
reports           ✅ View  ❌ Create  ❌ Update  ❌ Delete
... other features disabled
```

### **Type 3: Viewer Only**
```
products          ✅ View  ❌ Create  ❌ Update  ❌ Delete
categories        ✅ View  ❌ Create  ❌ Update  ❌ Delete
suppliers         ✅ View  ❌ Create  ❌ Update  ❌ Delete
stock_in          ✅ View  ❌ Create  ❌ Update  ❌ Delete
stock_out         ✅ View  ❌ Create  ❌ Update  ❌ Delete
sales_view        ✅ View  ❌ Create  ❌ Update  ❌ Delete
reports           ✅ View  ❌ Create  ❌ Update  ❌ Delete
... other features disabled
```

---

## ✅ Implementation Checklist

- [x] config/features.js बनाया
- [x] StaffManagementScreen improve किया
- [x] EditStaffPermissionsScreen improve किया
- [x] database.js में functions add किए
- [x] usePermissions hook update किया
- [ ] **DATABASE_SETUP.sql run करना (Next Step!)**

---

## 🚀 Next Steps

1. **Supabase में SQL run करो** → DATABASE_SETUP.sql
2. **App में test करो** → Staff add करो, permissions assign करो
3. **Screens में integrate करो** → usePermissions() hook use करो
4. **Permission check add करो** → Har screen में logic add करो

---

## 📞 Files Reference

```
Frontend Files:
- screens/staff/Staffmanagementscreen.js (Staff add/list करना)
- screens/staff/EditStaffPermissionsScreen.js (Permissions assign करना)
- config/features.js (Features list)
- config/roles.js (Roles definition)
- hooks/usePermissions.js (Permission checking)
- lib/database.js (Database functions)
- context/Authcontext.js (User state management)

Backend Files:
- DATABASE_SETUP.sql (Table + RPC functions)
- QUICK_SETUP.md (5 minute guide)
- BACKEND_SETUP_GUIDE.md (Detailed guide)
- VISUAL_SETUP_GUIDE.md (Visual diagrams)
```

---

**Ready?** अब DATABASE_SETUP.sql को Supabase में run कर दो! 🎉
