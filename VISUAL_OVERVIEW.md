# 🎨 VISUAL SYSTEM OVERVIEW

## **THE BIG PICTURE** 📊

```
┌─────────────────────────────────────────────────────────────────┐
│                    INVENTORY MANAGER APP                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  FRONTEND LAYER (React Native)                          │   │
│  │                                                         │   │
│  │  All Screens                                            │   │
│  │  ├─ Products Screen          ← Check 'products'       │   │
│  │  ├─ Categories Screen        ← Check 'categories'     │   │
│  │  ├─ Stock In/Out Screen      ← Check 'stock_in/out'   │   │
│  │  ├─ Sales Screen             ← Check 'sales_create'   │   │
│  │  ├─ Reports Screen           ← Check 'reports'        │   │
│  │  ├─ Staff Screen             ← Check 'staff'          │   │
│  │  └─ Settings Screen          ← Check 'settings'       │   │
│  │                                                         │   │
│  │  usePermissions Hook                                   │   │
│  │  ├─ getFeaturePermissions()                            │   │
│  │  ├─ hasFeatureAccess()                                 │   │
│  │  └─ hasPermission()                                    │   │
│  └────────────────┬────────────────────────────────────────┘   │
│                   │                                             │
│         RPC API Calls (Supabase)                               │
│                   │                                             │
│  ┌────────────────▼────────────────────────────────────────┐   │
│  │  BACKEND LAYER (Supabase PostgreSQL)                   │   │
│  │                                                         │   │
│  │  Tables:                                                │   │
│  │  ├─ auth.users (Supabase Auth)                         │   │
│  │  └─ public.staff_permissions (Custom)                  │   │
│  │     └─ Links each user to their permissions            │   │
│  │                                                         │   │
│  │  RPC Functions:                                         │   │
│  │  ├─ get_user_features(userId)                          │   │
│  │  │  └─ Returns all permissions for a user              │   │
│  │  │                                                     │   │
│  │  └─ update_staff_permission(...)                       │   │
│  │     └─ Creates or updates a permission record          │   │
│  │                                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## **DATA FLOW - USER LOGIN** 🔐

```
┌──────────────────────────────────┐
│   User Enters Email + Password   │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│    Supabase Auth (Firebase-like) │
│    Validates credentials         │
│    Returns JWT Token             │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│   signInUser() in database.js    │
│   Saves token to AsyncStorage    │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│   AuthContext calls:             │
│   getCurrentUser()               │
│   Fetch user from database       │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│   AuthContext calls:             │
│   fetchUserPermissions(userId)   │
└──────────────┬───────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│  supabase.rpc('get_user_features', {            │
│    p_user_id: userId                            │
│  })                                             │
└──────────────┬────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Supabase Backend (PostgreSQL):      │
│  SELECT * FROM staff_permissions     │
│  WHERE user_id = ?                   │
└──────────────┬───────────────────────┘
               │
               ▼
┌───────────────────────────────────────────┐
│  Returns Array:                           │
│  [{                                       │
│    feature_key: 'products',               │
│    can_view: true,                        │
│    can_create: true,                      │
│    can_update: false,                     │
│    can_delete: false                      │
│  }, ...]                                  │
└──────────────┬────────────────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  AuthContext:                    │
│  setPermissions(data)            │
│  Store in state                  │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  usePermissions() Hook:          │
│  Available throughout app        │
│  All screens can now check       │
│  permissions!                    │
└──────────────┴───────────────────┘
```

---

## **DATA FLOW - PERMISSION UPDATE** ⚙️

```
┌──────────────────────────────────────┐
│   Admin in Staff Management Screen   │
│   Click: "Assign Role"               │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│   EditStaffPermissionsScreen Opens       │
│                                          │
│   Shows Categories:                      │
│   ✓ Inventory Management                 │
│     ├─ Products (Toggle V/C/U/D)        │
│     ├─ Categories (Toggle V/C/U/D)      │
│     ├─ Stock In (Toggle V/C)            │
│     └─ Stock Out (Toggle V/C)           │
│                                          │
│   ✓ Sales & Invoicing                   │
│     ├─ Create Invoice (Toggle V/C)      │
│     ├─ View Sales (Toggle V)            │
│     └─ Delete Invoice (Toggle D)        │
│                                          │
│   ... more categories                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   Admin Toggles Permissions           │
│   [✓] ← Click → [✗]                   │
│                                       │
│   State Updates in JavaScript:        │
│   permissions = {                     │
│     'products': {                      │
│       can_view: true,                 │
│       can_create: true,               │
│       can_update: false,              │
│       can_delete: false               │
│     },                                │
│     'sales_create': {                 │
│       can_view: true,                 │
│       can_create: true,               │
│       can_update: false,              │
│       can_delete: false               │
│     },                                │
│     ...                               │
│   }                                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   Admin clicks:                       │
│   "Save All Permissions"              │
│                                       │
│   Loop through all features:          │
│   for (let feature in permissions) {  │
│     supabase.rpc(...)                │
│   }                                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│  FOR EACH FEATURE, call RPC:                 │
│                                              │
│  supabase.rpc('update_staff_permission', {   │
│    p_user_id: 'user-123',                    │
│    p_feature_key: 'products',                │
│    p_can_view: true,                         │
│    p_can_create: true,                       │
│    p_can_update: false,                      │
│    p_can_delete: false                       │
│  })                                          │
│                                              │
│  Repeat for 'sales_create', etc...           │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────┐
│  Supabase Backend (PostgreSQL):            │
│                                            │
│  INSERT INTO staff_permissions (...)       │
│  VALUES (user-123, 'products', T, T, F, F) │
│                                            │
│  ON CONFLICT (user_id, feature_key)        │
│  DO UPDATE SET can_view=T, can_create=T... │
│                                            │
│  (Creates new record if doesn't exist)     │
│  (Updates if already exists)               │
└──────────────┬─────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Returns: {                         │
│    success: true,                   │
│    feature_key: 'products',         │
│    message: 'Updated successfully'  │
│  }                                  │
│                                     │
│  (Repeated for all features)        │
└──────────────┬────────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│  All RPC calls complete          │
│  Success Alert shows             │
│  Navigate back to Staff List     │
└──────────────────────────────────┘
```

---

## **PERMISSION CHECK FLOW** ✅

```
┌──────────────────────────────────────┐
│   User Opens Products Screen         │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   ProductsScreen Component:          │
│   const { getFeaturePermissions }    │
│     = usePermissions()               │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   Call:                              │
│   const perms =                      │
│     getFeaturePermissions('products')│
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   Hook checks AuthContext.permissions│
│   Finds: {                           │
│     can_view: true,                  │
│     can_create: true,                │
│     can_update: false,               │
│     can_delete: false                │
│   }                                  │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   Conditional Rendering:             │
│                                      │
│   if (!perms.canView)                │
│     return <NotAuthorized />         │
│                                      │
│   {perms.canCreate && (              │
│     <FAB icon="add" />               │
│   )}                                 │
│                                      │
│   {perms.canUpdate && (              │
│     <Button title="Edit" />          │
│   )}                                 │
│                                      │
│   {perms.canDelete && (              │
│     <Button title="Delete" />        │
│   )}                                 │
└──────────────┬───────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│  Rendered Screen:                      │
│  ┌──────────────────────────────────┐  │
│  │  Products List                   │  │
│  │                                  │  │
│  │  Product 1                       │  │
│  │  Product 2                       │  │
│  │  Product 3                       │  │
│  │                                  │  │
│  │  [+ Add] [Edit]                  │  │
│  │  (Delete hidden - no permission) │  │
│  └──────────────────────────────────┘  │
│                                        │
│  User can see products ✓              │
│  User can add products ✓              │
│  User can edit products ✓             │
│  User CANNOT delete products ✗        │
└────────────────────────────────────────┘
```

---

## **DATABASE STRUCTURE** 🗄️

```
┌─────────────────────────────────────────────────────────┐
│                  SUPABASE DATABASE                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  auth.users (Supabase Default)                   │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ id: UUID                                         │  │
│  │ email: string                                    │  │
│  │ created_at: timestamp                            │  │
│  │ updated_at: timestamp                            │  │
│  │ raw_user_meta_data: JSON                         │  │
│  │   ├─ role: 'admin' | 'manager' | 'staff' ...    │  │
│  │   └─ name: string                                │  │
│  └──────────────┬───────────────────────────────────┘  │
│                 │ ONE-TO-MANY                           │
│                 │ (user.id → staff_permissions.user_id) │
│                 │                                       │
│  ┌──────────────▼───────────────────────────────────┐  │
│  │  public.staff_permissions (Custom)               │  │
│  ├───────────────────────────────────────────────────┤ │
│  │ id: UUID (Primary Key)                           │  │
│  │ user_id: UUID (Foreign Key → auth.users.id)      │  │
│  │ feature_key: VARCHAR (e.g., 'products')          │  │
│  │ can_view: BOOLEAN                                │  │
│  │ can_create: BOOLEAN                              │  │
│  │ can_update: BOOLEAN                              │  │
│  │ can_delete: BOOLEAN                              │  │
│  │ created_at: TIMESTAMP                            │  │
│  │ updated_at: TIMESTAMP                            │  │
│  │                                                  │  │
│  │ INDEXES:                                         │  │
│  │ ├─ PRIMARY KEY on (id)                           │  │
│  │ ├─ UNIQUE on (user_id, feature_key)              │  │
│  │ ├─ INDEX on (user_id)                            │  │
│  │ └─ INDEX on (feature_key)                        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘

EXAMPLE DATA:
┌─────┬──────────┬────────────────┬──────┬────────┬────────┬────────┐
│ id  │ user_id  │ feature_key    │ view │ create │ update │ delete │
├─────┼──────────┼────────────────┼──────┼────────┼────────┼────────┤
│ 1   │ user-abc │ products       │ true │ true   │ true   │ false  │
│ 2   │ user-abc │ stock_in       │ true │ true   │ false  │ false  │
│ 3   │ user-abc │ sales_create   │ false│ false  │ false  │ false  │
│ 4   │ user-def │ sales_create   │ true │ true   │ false  │ false  │
│ 5   │ user-def │ products       │ true │ false  │ false  │ false  │
└─────┴──────────┴────────────────┴──────┴────────┴────────┴────────┘
```

---

## **RPC FUNCTIONS** 🔌

```
┌─────────────────────────────────────────────────────┐
│        get_user_features(p_user_id UUID)            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Input: p_user_id = 'user-abc'                      │
│                                                     │
│  Query:                                             │
│  SELECT feature_key, can_view, can_create, ...      │
│  FROM staff_permissions                             │
│  WHERE user_id = 'user-abc'                         │
│                                                     │
│  Output:                                            │
│  [                                                  │
│    {feature_key: 'products', can_view: true, ...},  │
│    {feature_key: 'stock_in', can_view: true, ...},  │
│    ...                                              │
│  ]                                                  │
│                                                     │
│  Called When:                                       │
│  - User logs in                                     │
│  - App starts                                       │
│                                                     │
└─────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────┐
│  update_staff_permission(...)                            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Inputs:                                                 │
│  - p_user_id: UUID                                       │
│  - p_feature_key: VARCHAR                                │
│  - p_can_view: BOOLEAN                                   │
│  - p_can_create: BOOLEAN                                 │
│  - p_can_update: BOOLEAN                                 │
│  - p_can_delete: BOOLEAN                                 │
│                                                          │
│  Logic:                                                  │
│  INSERT INTO staff_permissions (...)                     │
│  ON CONFLICT (user_id, feature_key)                      │
│  DO UPDATE SET (...)                                     │
│                                                          │
│  Output:                                                 │
│  {                                                       │
│    success: true,                                        │
│    feature_key: 'products',                              │
│    message: 'Permission updated successfully'            │
│  }                                                       │
│                                                          │
│  Called When:                                            │
│  - Admin saves permissions                              │
│  - Permission is changed                                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## **8+ FEATURES** 🎯

```
📦 INVENTORY MANAGEMENT
├─ products           (4 permissions: V/C/U/D)
├─ categories        (4 permissions: V/C/U/D)
├─ suppliers         (4 permissions: V/C/U/D)
├─ stock_in         (2 permissions: V/C)
└─ stock_out        (2 permissions: V/C)

💰 SALES & INVOICING
├─ sales_create     (2 permissions: V/C)
├─ sales_view       (1 permission: V)
└─ sales_delete     (1 permission: D)

📊 REPORTS & ANALYTICS
└─ reports          (1 permission: V)

⚙️ ADMINISTRATION
├─ staff            (4 permissions: V/C/U/D)
└─ settings         (2 permissions: V/U)
```

---

**This entire system is production-ready. Just run the SQL! 🚀**
