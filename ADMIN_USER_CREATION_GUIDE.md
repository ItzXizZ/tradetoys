# 👑 Admin Guide: Creating User Accounts

## Quick Method: Create Users in Supabase Dashboard

Since the in-app user creation requires additional setup, use this method to create users:

### Step-by-Step:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/jjxwridpyplxqlefibni
   - Click **Authentication** in the sidebar
   - Click **Users** tab

2. **Create a New User**
   - Click **"Add user"** button
   - Select **"Create new user"**

3. **Fill in User Details**
   
   **For a Receiver (Family in Need):**
   ```
   Email: ethan8eight@gmail.com
   Password: (choose a password for them)
   Auto Confirm User: ✅ CHECK THIS BOX
   ```
   
   Click **Create user**

4. **Set User Metadata**
   - Find the user in the list
   - Click on their email to open details
   - Scroll to **"User Metadata"** section
   - Click **Edit** (pencil icon)
   - Replace the JSON with:

   **For Receiver:**
   ```json
   {
     "full_name": "Ethan",
     "role": "receiver",
     "points": 100
   }
   ```

   **For Donator:**
   ```json
   {
     "full_name": "Ethan",
     "role": "donator"
   }
   ```

   **For Admin:**
   ```json
   {
     "full_name": "Ethan",
     "role": "admin"
   }
   ```

5. **Save the Changes**
   - Click **Save**
   - The user can now log in immediately!

## Give Credentials to User

Share these with the user:
```
Website: http://localhost:3000/login (or your deployed URL)
Email: ethan8eight@gmail.com
Password: (the password you set)
```

## Adjust Receiver Points Later

To change a receiver's points:
1. In Supabase Dashboard, go to **Table Editor**
2. Select **receiver_points** table
3. Find the receiver's record
4. Edit the **total_points** field
5. Click **Save**

## Creating Multiple Users Quickly

You can use the SQL Editor for bulk user creation:

```sql
-- Note: This requires the service role key and should be done in Supabase SQL Editor
-- This won't work in the app due to security restrictions

-- First, you need to create the auth user in the Supabase Dashboard manually
-- Then run this to ensure their profile and points are set up:

-- Check if profile exists
SELECT * FROM profiles WHERE email = 'ethan8eight@gmail.com';

-- If profile doesn't exist, you may need to log them in once first
-- or the trigger will create it automatically
```

## Why Can't We Create Users in the App?

The client-side code can't create users with custom metadata and auto-confirmation because:
1. **Security**: Creating users requires service role privileges
2. **Email Confirmation**: By default, Supabase requires email confirmation
3. **Best Practice**: Admin operations should go through a secure backend

## Better Solution: Create an API Route (Optional Advanced Setup)

If you want in-app user creation, you'll need to:
1. Create a Next.js API route
2. Use the Supabase service role key (server-side only)
3. Implement proper authorization checks

Would you like me to implement this advanced solution?

