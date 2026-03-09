# Permission-Based Access Control - Visual Guide

## What the User Sees

### When They HAVE Permission
![Full Screen with Features Available]
- Normal screen loads
- Can use all features
- All buttons and options visible

### When They DON'T Have Permission
```
    [Lock Icon - Red]

        Access Denied

  You don't have access to
       [Feature Name]

  Please contact your administrator
   to request access
```

## Admin Setup Flow

### Step 1: Create Staff Member
```
Settings → Staff Management → [+ Add Staff]
- Enter Name
- Enter Email
- Set Password
- Click Create
```

### Step 2: Assign Permissions
```
Staff Management → [Select Staff Member] → Manage Permissions

Available Features:
├── Products
├── Categories
├── Suppliers
├── Stock In
├── Stock Out
├── Create Invoice
├── View Sales
├── Delete Invoice
├── Reports
├── Settings
└── Staff Management
```

### Step 3: Toggle Access
```
Stock Management Section:
  ☑ Stock In (can add stock)
  ☐ Stock Out (cannot remove stock)

Sales Section:
  ☑ Create Invoice (can create invoices)
  ☑ View Sales (can see sales history)
  ☐ Delete Invoice (cannot delete)

Reports Section:
  ☐ Reports (no access)
```

## Real-World Examples

### Example 1: Sales Person Only
**Allowed to:**
- ✅ Create Invoice
- ✅ View Sales
- ✅ View Products

**Denied access to:**
- ❌ Stock In (when they try: "You don't have access to Stock In")
- ❌ Stock Out (when they try: "You don't have access to Stock Out")
- ❌ Reports (when they try: "You don't have access to Reports")

### Example 2: Stock Manager Only
**Allowed to:**
- ✅ Stock In
- ✅ Stock Out
- ✅ View Products

**Denied access to:**
- ❌ Create Invoice (when they try: "You don't have access to Create Invoice")
- ❌ View Sales (when they try: "You don't have access to Sales View")
- ❌ Reports (when they try: "You don't have access to Reports")

### Example 3: Admin User
**Can Access:**
- ✅ Everything (no restrictions)
- ✅ Stock In ✅ Stock Out
- ✅ Create Invoice ✅ View Sales
- ✅ Reports ✅ Settings
- ✅ Staff Management

**Cannot be restricted:**
- Admin users bypass all permission checks

## Feature Keys Reference

For developers adding new screens:

```javascript
// Available Feature Keys
const FEATURES = {
  products: 'products',
  categories: 'categories',
  suppliers: 'suppliers',
  stock_in: 'stock_in',
  stock_out: 'stock_out',
  sales_create: 'sales_create',
  sales_view: 'sales_view',
  sales_delete: 'sales_delete',
  reports: 'reports',
  staff: 'staff',
  settings: 'settings'
};
```

## How to Add Permission Check to New Screen

```javascript
import { AccessDenied } from '../../components/Common';
import { usePermissions } from '../../hooks/usePermissions';

const NewScreen = () => {
  const { hasFeatureAccess } = usePermissions();
  
  // Check if user has access to your feature
  const hasAccess = hasFeatureAccess('feature_key');
  
  if (!hasAccess) {
    return <AccessDenied featureName="Feature Display Name" />;
  }

  // Rest of your component
  return (
    <View>
      {/* Screen content */}
    </View>
  );
};
```

## Database Integration

### Where Permissions Are Stored
- Table: `staff_permissions`
- Columns:
  - `user_id` - Staff member's ID
  - `feature_key` - Feature being restricted
  - `can_view` - Can view/access
  - `can_create` - Can create/add
  - `can_update` - Can edit/modify
  - `can_delete` - Can delete

### Permission Check Logic

```
User tries to access feature
        ↓
Is user ADMIN?
   ├→ YES: Grant access ✅
   └→ NO: Check staff_permissions table
            ├→ Permission found + can_view=true → Grant access ✅
            └→ Permission found + can_view=false → Show Access Denied ❌
```

## Testing Permission Changes

1. **Admin creates staff member** with limited permissions
2. **Logout** as admin
3. **Login** as staff member
4. **Try accessing** a feature they don't have:
   - Should see: "You don't have access to [Feature]"
5. **Try accessing** a feature they do have:
   - Should work normally
6. **Admin updates** permissions to grant new access
7. **Staff member** logs out and back in
8. **Try accessing** newly granted feature:
   - Should now work ✅

