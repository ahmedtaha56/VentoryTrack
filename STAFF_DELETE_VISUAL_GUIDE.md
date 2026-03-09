# Staff Delete Feature - Visual Guide

## Permission Levels

### ✅ CAN DELETE STAFF
- **Admin** - Full access, can delete anyone
- **Manager** - Can delete staff members (NEW - recently added)

### ❌ CANNOT DELETE STAFF
- **Staff** - No delete access
- **Viewer** - No delete access

## UI Layout

### Staff List Screen

```
┌─────────────────────────────────────────┐
│ Search bar                              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Staff Member Card                       │
│ ┌───────────────────────────────────────┤
│ │ Name: John Doe                        │
│ │ Email: john@company.com               │
│ │ Role: [Staff Badge - Blue]            │
│ │ Permissions: Products, Stock, Sales   │
│ │                                       │
│ │                [Permissions] [Delete] │
│ │                  (Blue)       (Red)   │
│ └───────────────────────────────────────┘
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Staff Member Card                       │
│ ┌───────────────────────────────────────┤
│ │ Name: Jane Smith                      │
│ │ Email: jane@company.com               │
│ │ Role: [Manager Badge - Orange]        │
│ │ Permissions: All Admin Features       │
│ │                                       │
│ │                [Permissions] [Delete] │
│ │                  (Blue)       (Red)   │
│ └───────────────────────────────────────┘
└─────────────────────────────────────────┘
```

## Delete Button Details

### Visual Appearance
- **Icon:** Trash icon 🗑️
- **Color:** Red (#ff3333)
- **Background:** Light red (#ffebee)
- **Label:** "Delete" or "Deleting..." (during operation)
- **Position:** Right side, next to Permissions button

### Button States

#### Normal State
```
┌──────────┐
│ 🗑️ Delete│
└──────────┘
(Red text, light red background)
```

#### Deleting State
```
┌──────────────┐
│ 🗑️ Deleting...│
└──────────────┘
(Red text, disabled)
```

#### No Permission
```
(Button not visible)
```

## Delete Flow - User Journey

### Step 1: See Delete Button
```
Staff List Screen
↓
Admin/Manager sees delete button for each staff
```

### Step 2: Click Delete Button
```
Tap Delete Button
↓
Delete Handler Triggered
```

### Step 3: Confirmation Dialog
```
┌────────────────────────────────────────┐
│ Delete Staff Member                    │
├────────────────────────────────────────┤
│ Are you sure you want to delete        │
│ John Doe?                              │
│ This action cannot be undone.          │
├────────────────────────────────────────┤
│           [Cancel]    [Delete]         │
│                       (Red/Destructive)│
└────────────────────────────────────────┘
```

### Step 4: Deletion Process
```
User confirms deletion
↓
Get current user info
↓
Call deleteStaffUser function
↓
1. Delete staff permissions
2. Delete auth user
3. Delete user profile
4. Create team notification
↓
Show success message
↓
Reload staff list
```

### Step 5: Real-Time Update
```
Staff member deleted on server
↓
Supabase sends change event
↓
subscribeToStaffChanges callback triggered
↓
Staff list reloaded for ALL users viewing it
↓
Deleted staff member disappears from all screens
↓
Team notification received by other members
```

### Step 6: Success Message
```
┌────────────────────────────────┐
│ Success                        │
├────────────────────────────────┤
│ John Doe has been deleted.     │
├────────────────────────────────┤
│              [OK]              │
└────────────────────────────────┘
```

## Real-Time Updates Visualization

### Before Deletion
```
User A (Admin)          User B (Manager)        User C (Staff)
├─ Staff List           ├─ Staff List           └─ View Only
│  ├─ John (Delete)     │  ├─ John (Delete)
│  ├─ Jane              │  ├─ Jane
│  └─ Bob               │  └─ Bob
└─ Sees Delete Button   └─ Sees Delete Button

User A Clicks Delete → John
```

### During Deletion (Real-Time)
```
User A (Admin)          User B (Manager)        User C (Staff)
├─ Deleting...          ├─ Refreshing...        ├─ Refreshing...
│  (Button disabled)    │  (List updating)      │  (No change)
└─                      └─                      └─
```

### After Deletion (Real-Time Synced)
```
User A (Admin)          User B (Manager)        User C (Staff)
├─ Staff List           ├─ Staff List           ├─ View Only
│  ├─ Jane              │  ├─ Jane              │  ├─ Jane
│  └─ Bob               │  └─ Bob               │  └─ Bob
└─ John Deleted!        └─ John Deleted!        └─ (No John here)

NOTIFICATION: "Admin deleted staff member: John"
```

## Permissions Matrix

```
┌──────────────┬──────────┬────────┬──────────┬───────────┐
│ Feature      │ Admin    │Manager │ Staff    │ Viewer    │
├──────────────┼──────────┼────────┼──────────┼───────────┤
│ View Staff   │ ✓✓✓✓     │ ✓✓✓✓   │ ✗        │ ✗         │
│ Add Staff    │ ✓✓✓✓     │ ✗      │ ✗        │ ✗         │
│ Update Staff │ ✓✓✓✓     │ ✗      │ ✗        │ ✗         │
│ Delete Staff │ ✓✓✓✓     │ ✓ NEW  │ ✗        │ ✗         │
│ Permissions  │ ✓✓✓✓     │ ✓✓✓✓   │ ✗        │ ✗         │
└──────────────┴──────────┴────────┴──────────┴───────────┘
```

## Error Scenarios

### Error: Permission Denied
- User is not admin or manager
- Delete button not visible
- Action blocked at source

### Error: User Not Found
- Staff member deleted from different session
- Error message: "Failed to delete staff member"
- Suggestion: Refresh and try again

### Error: Delete Permissions Failed
- Database error deleting permissions
- Delete still proceeds if user delete succeeds
- Error logged for debugging

### Error: Auth Delete Failed
- Problem deleting from Supabase Auth
- Staff record might still exist
- Error message shown to user

## Real-Time Subscription Status

### Active
```
✓ Listening to users table changes
✓ Detecting: INSERT, UPDATE, DELETE events
✓ Immediate refresh on any change
✓ All team members notified
```

### Cleanup on Unmount
```
✓ Unsubscribe function called
✓ Channel removed from Supabase
✓ No memory leaks
✓ Can be re-subscribed when screen opens again
```

## Action Item Checklist

- [x] Permission configuration updated
- [x] Delete function implemented
- [x] Subscription function implemented
- [x] UI button added
- [x] Handler function created
- [x] Real-time updates enabled
- [x] Notification system integrated
- [x] Error handling implemented
- [x] Styling applied
- [x] Documentation created
