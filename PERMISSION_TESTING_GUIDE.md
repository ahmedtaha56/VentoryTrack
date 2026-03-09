# Permission-Based Access Control - Testing Guide

## Quick Start Test

### Prerequisites
- App is running
- You have an admin account

### Test Scenario: Create Limited Sales Person

#### Step 1: Login as Admin
1. Open the app
2. Login with admin credentials

#### Step 2: Create Staff Member
1. Navigate to **Staff Management** (in More menu)
2. Click **+ Add Staff**
3. Fill in:
   - Name: "Ahmed Sales"
   - Email: "ahmed@company.com"
   - Password: "test123456"
   - Role: Staff
4. Click **Create**

#### Step 3: Assign Permissions to Ahmed
1. Still in **Staff Management**
2. Find "Ahmed Sales" in the list
3. Click the **lock icon** or **Manage Permissions**
4. In the modal:
   - **Stock In** → Turn OFF (toggle)
   - **Stock Out** → Turn OFF (toggle)
   - **Create Invoice** → Turn ON (toggle)
   - **View Sales** → Turn ON (toggle)
   - **Reports** → Turn OFF (toggle)
   - All others → Turn OFF
5. Click **Save Permissions**

#### Step 4: Logout as Admin
1. Go to **Settings**
2. Scroll down and click **Logout**
3. Confirm logout

#### Step 5: Login as Ahmed
1. Email: "ahmed@company.com"
2. Password: "test123456"
3. Click **Login**

#### Step 6: Test Access to Stock In (Should FAIL)
1. From bottom navigation, tap **Stock** or navigate to Stock section
2. Try to click **Stock In**
3. **Expected Result:** 
   ```
   ❌ Access Denied
   You don't have access to Stock In
   ```

#### Step 7: Test Access to Create Invoice (Should SUCCEED)
1. From bottom navigation, tap **Sales** or navigate to Sales section
2. Try to click **+ Create Invoice**
3. **Expected Result:**
   ```
   ✅ Create Invoice screen loads normally
   Form displays with all fields
   ```

#### Step 8: Test Access to Reports (Should FAIL)
1. From bottom navigation, tap **More** or navigate to Reports
2. Try to access **Reports**
3. **Expected Result:**
   ```
   ❌ Access Denied
   You don't have access to Reports
   ```

---

## Comprehensive Test Cases

### Test Case 1: Stock Manager
**Permissions:**
- ✅ Stock In
- ✅ Stock Out
- ❌ Create Invoice
- ❌ View Sales
- ❌ Reports

**Expected Behavior:**
- Can access stock screens
- Cannot access sales screens
- Cannot access reports
- Should see access denied on sales features

### Test Case 2: Report Viewer Only
**Permissions:**
- ❌ Stock In
- ❌ Stock Out
- ❌ Create Invoice
- ✅ View Sales
- ✅ Reports

**Expected Behavior:**
- Cannot access stock management
- Can view sales and reports
- Cannot create invoices
- Should see access denied on stock features

### Test Case 3: Full Access Staff (Except Delete)
**Permissions:**
- ✅ Stock In
- ✅ Stock Out
- ✅ Create Invoice
- ✅ View Sales
- ✅ Reports
- ❌ Delete Invoice
- ❌ Staff Management

**Expected Behavior:**
- Can access almost everything
- Cannot delete invoices
- Cannot manage other staff
- Can view but cannot delete operations

---

## Features Tested by This Implementation

### Stock Management
- **Stock In Screen**
  - Feature Key: `stock_in`
  - Test: Try to add stock → Should show "Access Denied" if no permission
  
- **Stock Out Screen**
  - Feature Key: `stock_out`
  - Test: Try to remove stock → Should show "Access Denied" if no permission

### Sales Management
- **Create Invoice Screen**
  - Feature Key: `sales_create`
  - Test: Try to create invoice → Should show "Access Denied" if no permission
  
- **View Sales List**
  - Feature Key: `sales_view`
  - Test: Try to view sales → Should show "Access Denied" if no permission

### Inventory
- **Categories**
  - Feature Key: `categories`
  - Test: Try to manage categories → Should show "Access Denied" if no permission
  
- **Suppliers**
  - Feature Key: `suppliers`
  - Test: Try to manage suppliers → Should show "Access Denied" if no permission

### Reports & Settings
- **Reports**
  - Feature Key: `reports`
  - Test: Try to view reports → Should show "Access Denied" if no permission
  
- **Settings**
  - Feature Key: `settings`
  - Test: Try to access settings → Should show "Access Denied" if no permission

---

## Debugging

### If Permission Check Doesn't Work

#### Check 1: Verify User Role
```javascript
// In AuthContext, check if userData.role is being set correctly
console.log('User Role:', userData?.role);
console.log('User Data:', userData);
```

#### Check 2: Verify Permissions Loaded
```javascript
// In usePermissions hook
const { permissions } = usePermissions();
console.log('Loaded Permissions:', permissions);
```

#### Check 3: Test Permission Function
```javascript
// Call hasFeatureAccess and check result
const hasAccess = hasFeatureAccess('stock_in');
console.log('Has Stock In Access:', hasAccess);
```

#### Check 4: Database Check
In Supabase:
```sql
-- Check if permissions are saved
SELECT * FROM staff_permissions 
WHERE user_id = 'user_id_here';

-- Check user role
SELECT id, name, email, role FROM users 
WHERE email = 'ahmed@company.com';
```

---

## Admin Permission Changes Test

#### Scenario: Dynamic Permission Update
1. **Login as Admin** → Create staff "John"
2. **Grant** only "View Sales" permission
3. **Logout** and **Login as John** → Cannot access stock (✅ correct)
4. **Logout** and **Login as Admin** → Grant John "Stock In" permission
5. **Logout** and **Login as John** → Should now see "Stock In" available (✅ correct)

---

## Edge Cases to Test

### Edge Case 1: Admin Access
- Login as admin
- Should have access to ALL features
- Permission system should NOT restrict admin

### Edge Case 2: New Staff Without Permissions
- Create new staff member
- Don't assign any permissions
- Should see "Access Denied" on all restricted features

### Edge Case 3: Logout and Login
- Permissions should persist after logout/login
- Should not reset
- Database queries should work correctly

### Edge Case 4: Permission Revocation
- Give user permission
- Revoke permission while they're logged in
- Logout and login
- Should show "Access Denied"

---

## Success Criteria Checklist

- [ ] Access Denied component displays properly
- [ ] User without permission sees "You don't have access to [Feature]"
- [ ] User with permission can access the screen normally
- [ ] Admin has access to all features
- [ ] Permission changes apply after logout/login
- [ ] Different staff members have different permissions
- [ ] No errors in console for permission checks
- [ ] UI is responsive when showing access denied
- [ ] "Contact administrator" message is helpful

---

## Common Issues & Solutions

### Issue: User sees access denied but should have access
**Solution:**
1. Check permissions in database
2. Verify user is not assigned admin role conflicting with staff permissions
3. Clear app cache and re-login

### Issue: All staff members have access to everything
**Solution:**
1. Check if `usePermissions` hook is being called
2. Verify `hasFeatureAccess()` is being used correctly
3. Check database permissions table is populated

### Issue: Permission changes don't apply immediately
**Solution:**
1. This is expected - user must logout and login
2. Or implement real-time permission updates using Supabase subscriptions
3. For now, inform user to logout and login

