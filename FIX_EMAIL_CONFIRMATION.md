# 🔧 Fix Email Confirmation Issues

## Problem
Users (donators and receivers) are getting "email not confirmed" errors when trying to login.

## Solution: Disable Email Confirmation

### Step 1: Go to Supabase Auth Settings

1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/jjxwridpyplxqlefibni
2. Click **"Authentication"** in the left sidebar
3. Click **"Providers"** tab
4. Scroll down to find **"Email"** provider

### Step 2: Disable Email Confirmation

1. Click on **"Email"** to expand it
2. Look for **"Confirm email"** toggle
3. **Turn OFF** the "Confirm email" toggle
4. Click **"Save"**

### Alternative: Configure Email Settings

If you need to keep email confirmation but want specific users to bypass it:

1. Go to **Authentication** → **Settings**
2. Under **"Email"** section:
   - **Disable** "Enable email confirmations" 
   - OR set "Confirm email" to OFF

### Step 3: For Existing Users

If you already created users who need confirmation, you need to manually confirm them:

1. Go to **Authentication** → **Users**
2. Find each user
3. Click on their email
4. Look for **"Email Confirmed"** field
5. If it says "No" or shows a timestamp, click **"Confirm user"** button
6. Or in the user details, you can set `email_confirmed_at` manually

### Step 4: Update Existing Users via SQL (Quick Fix)

Run this in **SQL Editor** to confirm all existing users:

```sql
-- Confirm all existing users
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

## For Admin-Created Users

When creating users in the Supabase Dashboard:
- Always check **"Auto Confirm User"** checkbox
- This bypasses email confirmation for that user

## For Donator Registration

The app registration form will work automatically once you disable email confirmation in the Auth settings.

## Verification

After disabling email confirmation:

1. Test donator registration at http://localhost:3000/register
2. Test admin-created receiver login
3. Users should be able to login immediately

## Important Notes

- Disabling email confirmation means anyone can register with any email
- For donators, this is fine since they're volunteers
- For receivers, admins create their accounts so it's secure
- No email verification emails will be sent

## If You Want Email Confirmation Later

If you need email confirmation for security:
1. Keep it disabled for now
2. Later, set up a custom SMTP provider
3. Customize the confirmation email template
4. Re-enable email confirmation

This is recommended for production but not necessary for testing/initial setup.

