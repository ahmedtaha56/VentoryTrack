# Notification Deletion Fix

This document summarizes the steps taken to fix the notification deletion issue.

## 1. The Problem

When an admin deletes a notification, it should be deleted for the entire team. However, the previous implementation was not working correctly due to a restrictive Row Level Security (RLS) policy on the `notifications` table.

Also, the previous policy was too permissive and allowed staff members to delete their own notifications. The requirement is that only admins can delete notifications.

## 2. The Fix

To fix this, I have made the following changes:

### 2.1. SQL Fix

I have created a new SQL file named `FIX_NOTIFICATIONS_DELETE_RLS.sql`. This file contains the necessary SQL to update the RLS policies on your `notifications` table to only allow admins to delete notifications.

**You need to run the content of this file in the SQL editor in your Supabase project.**

### 2.2. Front-end Fix

I have updated the `screens/notifications/Notificationsscreen.js` file to:

*   Only show the delete button to admins.
*   Correctly send a request to delete all notifications with the same message if the user is an admin.
*   Subscribe to real-time `DELETE` events on the `notifications` table, so the list is updated in real-time when a notification is deleted.

## 3. What You Need To Do

1.  Go to the SQL Editor in your Supabase project.
2.  Open the `FIX_NOTIFICATIONS_DELETE_RLS.sql` file.
3.  Copy the content of the file.
4.  Paste the content into the SQL editor.
5.  Run the query.

After you have run the SQL query, the notification deletion issue should be resolved. Only admins will be able to delete notifications, and when they do, the notification will be deleted for the entire team.