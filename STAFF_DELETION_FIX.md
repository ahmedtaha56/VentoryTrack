# ✅ Staff Deletion Fix

## Problem
Staff members were being deleted from permissions and user data, but the record was still appearing in the staff list. This was due to **RLS (Row-Level Security) policies** that prevented deletion.

## Solution
The app now uses a **safe RPC function** (`safe_delete_staff_user`) that:
- Has proper permission checks built-in
- Uses `SECURITY DEFINER` to execute with elevated privileges
- Returns clear success/error messages
- Deletes both permissions and user profile atomically

## Required Action
You must run the SQL file to enable this functionality:

### Steps:
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of: `FIX_USERS_DELETE_RLS.sql`
5. Click **Run**

### What it does:
- ✅ Enables RLS on the `users` table
- ✅ Creates a DELETE policy for managers/admins
- ✅ Creates the `safe_delete_staff_user` RPC function
- ✅ Grants execute permissions to authenticated users

## Testing
After running the SQL:
1. Click delete on any staff member
2. Confirm deletion in modal
3. Staff member should disappear from the list immediately
4. All team members should see the real-time update
5. Check notifications - deletion event should be recorded

## Code Changes
- `lib/database.js` - Updated `deleteStaffUser()` to use RPC function instead of direct queries
- Created `FIX_USERS_DELETE_RLS.sql` - SQL file with RLS policies and RPC function

## How It Works
1. Manager clicks "Delete" button
2. Confirmation modal appears
3. Clicks "Delete" to confirm
4. App calls `deleteStaffUser()` function
5. Function calls `safe_delete_staff_user()` RPC
6. RPC function (with SECURITY DEFINER):
   - Checks if current user has permission
   - Deletes from `staff_permissions` table
   - Deletes from `users` table
   - Returns success/failure
7. App reloads staff list
8. Staff member is gone
9. Real-time notification sent to team

## Error Handling
If RPC returns an error:
- "Insufficient permissions" - Manager role needed or feature permission not granted
- Database errors - Shown as "Failed to delete user"
- Other errors - Full error message displayed to user
