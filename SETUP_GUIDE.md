# 🎅 Quick Setup Guide for TradeToys.ca

Follow these steps in order to get your application running:

## Step 1: Install Dependencies ⬇️

```bash
npm install
```

## Step 2: Create Environment File 🔧

Create a file named `.env.local` in the root directory with:

```
NEXT_PUBLIC_SUPABASE_URL=https://jjxwridpyplxqlefibni.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqeHdyaWRweXBseHFsZWZpYm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTU3MDMsImV4cCI6MjA3ODEzMTcwM30.Co6qA8Yw_yDoVQtn6ywwItl4qzEh6PKuPjkFbKq8nmI
```

## Step 3: Set Up Supabase Database 🗄️

1. Go to: https://supabase.com/dashboard/project/jjxwridpyplxqlefibni
2. Click on **SQL Editor** in the left sidebar
3. Open the `supabase-schema.sql` file from this project
4. Copy ALL the SQL code
5. Paste it into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for "Success. No rows returned" message

This creates all tables, policies, and functions needed.

## Step 4: Create Storage Bucket 📦

1. In Supabase Dashboard, click **Storage** in the left sidebar
2. Click **"New bucket"** button
3. Set:
   - Name: `toy-images`
   - Public bucket: **YES** ✅
4. Click **Create bucket**

### Add Storage Policies:

1. Go back to **SQL Editor**
2. Run this SQL:

```sql
CREATE POLICY "Anyone can view toy images" ON storage.objects
    FOR SELECT USING (bucket_id = 'toy-images');

CREATE POLICY "Donators can upload toy images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'toy-images' AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'donator'
        )
    );

CREATE POLICY "Donators can update their toy images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'toy-images' AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'donator'
        )
    );
```

## Step 5: Create Admin Account 👑

1. In Supabase Dashboard, click **Authentication** in left sidebar
2. Click **Users** tab
3. Click **"Add user"** → **"Create new user"**
4. Fill in:
   - Email: `admin@tradetoys.ca` (or your email)
   - Password: (choose a strong password - you'll use this to login)
   - Auto Confirm User: ✅ **CHECK THIS BOX**
5. Click **Create user**
6. Find the user in the list and click on their email
7. Scroll to **"User Metadata"** section
8. Click **Edit** (pencil icon)
9. Replace the JSON with:

```json
{
  "full_name": "Admin",
  "role": "admin"
}
```

10. Click **Save**

## Step 6: Run the Application 🚀

```bash
npm run dev
```

Open your browser to: http://localhost:3000

## Step 7: First Login 🎄

1. You'll be redirected to login page
2. Use the admin credentials you created
3. You're now in the Admin Dashboard!

## Next Steps 🎁

### As Admin:
1. **Create Receiver Accounts**:
   - Click "Create User" 
   - Set role to "Receiver"
   - Allocate points (e.g., 100 points)
   - Give them their login credentials

2. **Create/Invite Donators**:
   - Donators can register themselves at `/register`
   - Or you can create their accounts manually

### As Donator:
1. Register at http://localhost:3000/register
2. Login with your credentials
3. Click "Donate a Toy"
4. Upload toy image, add details, set point value
5. Submit to make it available

### As Receiver:
1. Login with credentials provided by admin
2. Browse the marketplace
3. Click on toys to view details
4. Add toys to "Santa's Sack" (if you have enough points)
5. View your sack by clicking "Santa's Sack" button

## Troubleshooting 🔧

### "No rows returned" - Tables already exist
- This is fine! Your database is already set up.

### Can't upload images
- Make sure `toy-images` bucket is public
- Verify storage policies are created
- Check that you're logged in as a donator

### Login not working
- Verify `.env.local` file exists and has correct values
- Check that user is confirmed in Supabase Auth
- Clear browser cache and try again

### Point system not working
- Make sure all SQL functions were created (check supabase-schema.sql)
- Verify receiver has points allocated
- Check receiver_points table in Supabase

## 🎅 You're All Set!

Your TradeToys.ca platform is now ready to spread Christmas joy!

For detailed information, see the main `README.md` file.

