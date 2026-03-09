# 🎯 PERMISSION SYSTEM - COMPLETE SETUP GUIDE

## **WHAT YOU GET** ✨

```
Your Inventory Manager App
│
├─ 📱 FRONTEND (React Native)
│  ├─ Staff Management Screen
│  ├─ Permission Assignment UI
│  ├─ usePermissions Hook
│  └─ Auto Permission Checks
│
└─ ☁️ SUPABASE BACKEND
   ├─ staff_permissions Table
   ├─ get_user_features() RPC
   └─ update_staff_permission() RPC
```

---

## **BACKEND COMPONENTS EXPLAINED** 🛠️

### **1. staff_permissions TABLE**
```
Purpose: Store who can do what

Database Structure:
┌──────────────────────────────────────────────┐
│ id (UUID)                                    │
│ user_id (UUID) → auth.users.id              │
│ feature_key (VARCHAR) → 'sales_create'      │
│ can_view, can_create, can_update, can_delete │
│ created_at, updated_at                       │
└──────────────────────────────────────────────┘

Example:
user_id: 'abc-123'
feature_key: 'sales_create'
can_view: true
can_create: true
can_update: false
can_delete: false

Meaning: यह user सिर्फ Sales Invoice बना सकता है, edit/delete नहीं।
```

---

### **2. get_user_features() RPC**
```
Purpose: User की सभी permissions fetch करना

SQL Function:
SELECT * FROM staff_permissions WHERE user_id = ?

Frontend Call:
const { data } = await supabase.rpc('get_user_features', {
  p_user_id: userId
});

Returns:
[
  {feature_key: 'sales_create', can_view: true, can_create: true, ...},
  {feature_key: 'products', can_view: false, can_create: false, ...},
  ...
]

कब चलता है:
- User login करता है
- App शुरू होता है
- AuthContext में permissions load होती हैं
```

---

### **3. update_staff_permission() RPC**
```
Purpose: किसी permission को create या update करना

SQL Function:
INSERT INTO staff_permissions (...)
ON CONFLICT (user_id, feature_key) DO UPDATE

Frontend Call:
const { data } = await supabase.rpc('update_staff_permission', {
  p_user_id: 'abc-123',
  p_feature_key: 'products',
  p_can_view: true,
  p_can_create: true,
  p_can_update: false,
  p_can_delete: false
});

Returns:
{success: true, feature_key: 'products', message: '...'}

कब चलता है:
- Admin "Save Permissions" button दबाता है
- EditStaffPermissionsScreen से
```

---

## **SETUP STEPS** 📋

### **Step 1: Supabase Dashboard खोलो**
```
https://supabase.com
→ Select your project
→ SQL Editor (बाईं ओर menu से)
```

### **Step 2: DATABASE_SETUP.sql Run करो**
```
1. DATABASE_SETUP.sql file खोलो
2. Entire SQL copy करो
3. Supabase SQL Editor में paste करो
4. "Run" button दबाओ
5. ✅ Table + Functions बन जाएंगे
```

### **Step 3: Verify करो**
```sql
-- Check if table exists
SELECT * FROM staff_permissions;

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
```

### **Step 4: App में Test करो**
```
1. Your Inventory Manager app खोलो
2. Staff Management screen जाओ
3. नया staff add करो
4. "Assign Role" / "Permissions" button दबाओ
5. Toggles को change करो
6. "Save" दबाओ
7. ✅ Database में save हो जाएगा!
```

---

## **COMPLETE FLOW** 🔄

### **जब User Login करता है:**
```
1. Email + Password → Supabase Auth
   ↓
2. signInUser() → success
   ↓
3. getCurrentUser() → fetch user data
   ↓
4. AuthContext.setupUserContext()
   ↓
5. fetchUserPermissions(userId)
   ↓
6. supabase.rpc('get_user_features', {p_user_id: userId})
   ↓
7. Database में query:
   SELECT * FROM staff_permissions WHERE user_id = ?
   ↓
8. Array of permissions return होता है:
   [{feature_key: 'sales_create', can_view: true, ...}, ...]
   ↓
9. AuthContext.setPermissions(data)
   ↓
10. usePermissions() hook सभी screens में available
```

### **जब Admin Permission Assign करता है:**
```
1. Staff Management Screen में staff select करो
   ↓
2. "Assign Role" or "Edit Permissions" दबाओ
   ↓
3. EditStaffPermissionsScreen खुले
   ↓
4. Features categories expand करो
   ↓
5. Toggle buttons से permissions change करो
   ↓
6. "Save All Permissions" दबाओ
   ↓
7. Loop through 8+ features
   FOR each feature:
     supabase.rpc('update_staff_permission', {
       p_user_id: staffId,
       p_feature_key: feature_name,
       p_can_view: true/false,
       p_can_create: true/false,
       p_can_update: true/false,
       p_can_delete: true/false
     })
   ↓
8. Database में INSERT या UPDATE
   INSERT INTO staff_permissions (...)
   ON CONFLICT DO UPDATE
   ↓
9. Success message दिखे
   ↓
10. Back to Staff List
```

### **जब User कोई Feature खोलता है:**
```
1. User किसी screen को open करता है (e.g., ProductsScreen)
   ↓
2. usePermissions hook use करो:
   const { getFeaturePermissions } = usePermissions()
   const perms = getFeaturePermissions('products')
   ↓
3. Check करो permissions:
   {
     canView: true,
     canCreate: true,
     canUpdate: false,
     canDelete: false
   }
   ↓
4. Conditionally render करो:
   if (!perms.canView) return <NotAuthorized />
   {perms.canCreate && <AddButton />}
   {perms.canDelete && <DeleteButton />}
   ↓
5. Only allowed buttons/features दिखाई दें
```

---

## **DATABASE TABLE EXAMPLE** 📊

```
staff_permissions Table:

id    | user_id   | feature_key    | can_view | can_create | can_update | can_delete
------|-----------|----------------|----------|------------|------------|----------
1     | user-123  | products       | true     | true       | true       | true
2     | user-123  | stock_in       | true     | true       | false      | false
3     | user-123  | sales_create   | false    | false      | false      | false
4     | user-456  | sales_create   | true     | true       | false      | false
5     | user-456  | sales_view     | true     | false      | false      | false
6     | user-456  | products       | true     | false      | false      | false
7     | user-456  | reports        | true     | false      | false      | false

Interpretation:
user-123: यह person products पर पूरा control है लेकिन sales access नहीं है।
user-456: यह person सिर्फ sales करने के लिए है, products manage नहीं कर सकता।
```

---

## **FEATURES LIST** 🎯

```
✨ 8+ Features with 4 Permission Types (View/Create/Update/Delete)

📦 INVENTORY MANAGEMENT
   ├─ products       - Product inventory management
   ├─ categories    - Product categories
   ├─ suppliers     - Supplier information
   ├─ stock_in     - Add stock
   └─ stock_out    - Remove stock

💰 SALES & INVOICING
   ├─ sales_create  - Create invoices
   ├─ sales_view   - View sales history
   └─ sales_delete - Delete invoices

📊 REPORTS
   └─ reports       - View reports (view-only)

⚙️ ADMINISTRATION
   ├─ staff         - Manage staff
   └─ settings      - App settings
```

---

## **ACTUAL PERMISSION EXAMPLES** 💡

### **Permission Set 1: Sales Executive**
```
✅ sales_create  → View + Create (बना सकते हो)
✅ sales_view    → View (देख सकते हो)
✅ products      → View (देख सकते हो)
❌ products      → Create/Update/Delete (नहीं बना सकते)
❌ stock_in      → Access नहीं
❌ staff         → Access नहीं
```

### **Permission Set 2: Inventory Manager**
```
✅ products      → View + Create + Update + Delete (पूरा control)
✅ categories    → View + Create + Update (Delete नहीं)
✅ suppliers     → View + Create + Update (Delete नहीं)
✅ stock_in      → View + Create (Update/Delete नहीं)
✅ stock_out     → View + Create (Update/Delete नहीं)
✅ reports       → View only
✅ sales_view    → View only
❌ sales_create  → Access नहीं
❌ staff         → Access नहीं
```

### **Permission Set 3: Viewer Only**
```
✅ products      → View only
✅ categories    → View only
✅ suppliers     → View only
✅ stock_in      → View only
✅ stock_out     → View only
✅ sales_view    → View only
✅ reports       → View only
❌ All Create/Update/Delete → नहीं
❌ staff         → Access नहीं
```

---

## **THREE KEY FILES YOU NEED** 📄

### **1. DATABASE_SETUP.sql** (Backend)
```sql
-- Run in Supabase SQL Editor
-- Creates table + 2 RPC functions
-- ~150 lines
```

### **2. Frontend Code** (Already Done)
```
config/features.js        ✅ Features list
config/roles.js          ✅ Roles definition
hooks/usePermissions.js  ✅ Permission checking
screens/staff/*          ✅ UI screens
lib/database.js          ✅ Database functions
```

### **3. Documentation** (You have these)
```
QUICK_SETUP.md               → 5 minute setup
BACKEND_SETUP_GUIDE.md       → Detailed explanation
VISUAL_SETUP_GUIDE.md        → With diagrams
SYSTEM_SUMMARY.md            → Complete overview
README_PERMISSIONS.md        → This file
```

---

## **QUICK CHECKLIST** ✓

- [ ] Read QUICK_SETUP.md (5 minutes)
- [ ] Open DATABASE_SETUP.sql
- [ ] Go to Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Copy entire DATABASE_SETUP.sql
- [ ] Paste in SQL Editor
- [ ] Click "Run"
- [ ] Verify with SELECT queries
- [ ] Open your app
- [ ] Test Staff Management + Permissions
- [ ] Start assigning permissions!

---

## **COMMON QUESTIONS** ❓

**Q: क्या मुझे SQL सीखना ज़रूरी है?**
A: नहीं! बस copy-paste करो।

**Q: क्या यह secure है?**
A: हाँ, RLS policies से secure है।

**Q: क्या मैं permissions real-time update कर सकता हूँ?**
A: App में nहीं, logout/login करके हाँ।

**Q: क्या नए features add कर सकता हूँ?**
A: हाँ, features.js में add करो।

**Q: अगर SQL fail हो?**
A: Check करो Supabase Console में क्या error है।

---

## **NEXT ACTIONS** 🚀

```
1. READ THIS FILE (You're here ✓)
   ↓
2. READ QUICK_SETUP.md
   ↓
3. RUN DATABASE_SETUP.sql
   ↓
4. TEST IN APP
   ↓
5. INTEGRATE IN ALL SCREENS
   ↓
6. DEPLOY! 🎉
```

---

**That's it! Aapki permission system complete है. Sirf backend setup करना baaki hai! 🎊**
