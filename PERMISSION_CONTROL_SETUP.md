# Permission-Based Access Control Implementation

## Overview
Implemented permission-based access control across all main screens. Staff members can now only access features they have been granted permission for. If they don't have access, they see: **"You don't have access to [Feature Name]"**

## What Changed

### 1. New Access Denied Component (`Common.js`)
Added reusable `AccessDenied` component that displays:
- Lock icon
- "Access Denied" title
- "You don't have access to [Feature Name]" message
- Suggestion to contact administrator

### 2. Permission Checks Added to These Screens

#### Stock Management
- **Stock In Screen** (`screens/stock/Stockinscreen.js`)
  - Permission Required: `stock_in`
  - Shows "Access Denied" if user doesn't have permission
  
- **Stock Out Screen** (`screens/stock/Stockoutscreen.js`)
  - Permission Required: `stock_out`
  - Shows "Access Denied" if user doesn't have permission

#### Sales Management
- **Create Invoice Screen** (`screens/sales/Createinvoicescreen.js`)
  - Permission Required: `sales_create`
  - Shows "Access Denied" if user doesn't have permission
  
- **Sales List Screen** (`screens/sales/Saleslistscreen.js`)
  - Permission Required: `sales_view`
  - Shows "Access Denied" if user doesn't have permission

#### Inventory
- **Categories Screen** (`screens/categories/Categorylistscreen.js`)
  - Permission Required: `categories`
  - Shows "Access Denied" if user doesn't have permission
  
- **Suppliers Screen** (`screens/suppliers/Supplierlistscreen.js`)
  - Permission Required: `suppliers`
  - Shows "Access Denied" if user doesn't have permission

#### Reports & Settings
- **Reports Screen** (`screens/reports/Reportsscreen.js`)
  - Permission Required: `reports`
  - Shows "Access Denied" if user doesn't have permission
  
- **Settings Screen** (`screens/settings/Settingsscreen.js`)
  - Permission Required: `settings`
  - Shows "Access Denied" if user doesn't have permission

## How It Works

### Permission Check Flow
1. Each screen imports `usePermissions` hook and `AccessDenied` component
2. At the top of the component, it calls `hasFeatureAccess('feature_key')`
3. If `hasFeatureAccess()` returns `false`, the screen immediately renders `AccessDenied`
4. If `true`, the screen renders normally

### Example:
```javascript
import { AccessDenied } from '../../components/Common';
import { usePermissions } from '../../hooks/usePermissions';

const StockInScreen = () => {
  const { hasFeatureAccess } = usePermissions();
  const hasStockInAccess = hasFeatureAccess('stock_in');

  if (!hasStockInAccess) {
    return <AccessDenied featureName="Stock In" />;
  }

  // Rest of the screen...
};
```

## Available Features for Permission Assignment

### Features List
- `products` - Manage product inventory
- `categories` - Manage product categories
- `suppliers` - Manage supplier information
- `stock_in` - Add stock to inventory
- `stock_out` - Remove stock from inventory
- `sales_create` - Create and generate sales invoices
- `sales_view` - View sales history and invoices
- `sales_delete` - Delete sales invoices
- `reports` - View sales and inventory reports
- `staff` - Manage staff and permissions
- `settings` - App settings and configuration

## Admin Notes

### How to Set Up Permissions
1. Login as admin
2. Go to **Staff Management**
3. Select a staff member
4. Click **Manage Permissions**
5. Toggle the features you want to grant access to
6. Save changes

### Behavior
- **Admin Users**: Have full access to all features (no permission checks)
- **Staff Users**: Can only access features assigned to them
- **Unassigned Features**: Staff members see "You don't have access to this" message

## Testing Checklist

- [ ] Create a staff member with limited permissions
- [ ] Login as that staff member
- [ ] Try to access a feature they don't have permission for
- [ ] Verify "You don't have access to [Feature]" message appears
- [ ] Go back and verify other screens still work normally
- [ ] Admin user should have access to all features

## Files Modified

1. `components/Common.js` - Added `AccessDenied` component
2. `screens/stock/Stockinscreen.js` - Added permission check
3. `screens/stock/Stockoutscreen.js` - Added permission check
4. `screens/sales/Createinvoicescreen.js` - Added permission check
5. `screens/sales/Saleslistscreen.js` - Added permission check
6. `screens/categories/Categorylistscreen.js` - Added permission check
7. `screens/suppliers/Supplierlistscreen.js` - Added permission check
8. `screens/reports/Reportsscreen.js` - Added permission check
9. `screens/settings/Settingsscreen.js` - Added permission check

## Key Points

✅ **Admins always have full access** - No permission restrictions  
✅ **Graceful UI** - Users see a friendly message, not error messages  
✅ **Reusable** - `AccessDenied` component can be used in other screens  
✅ **Consistent** - All screens use the same permission system  
✅ **Scalable** - Easy to add permission checks to new screens  

