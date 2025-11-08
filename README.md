# 🎅 TradeToys.ca - Christmas Toy Donation Platform

A festive web application connecting toy donors with families in need during the Christmas season. Built with Next.js and Supabase.

## 🎄 Features

### For Donators 🎁
- Upload toys with images, descriptions, and point values
- Track donated toys and their status
- See which toys have been claimed

### For Receivers 🎄
- Browse available toys in a festive marketplace
- Add toys to "Santa's Sack" using allocated points
- View point balance and selected toys

### For Admins 👑
- Create user accounts (donators and receivers)
- Manage receiver point allocations
- Monitor all toys in the system
- Track which toys are in each receiver's sack

## 🎨 Design

The app features a beautiful Christmas theme with:
- Red, green, and white color scheme
- Festive UI elements and animations
- "Santa's Sack" shopping cart metaphor
- Point-based toy selection system

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jjxwridpyplxqlefibni.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqeHdyaWRweXBseHFsZWZpYm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTU3MDMsImV4cCI6MjA3ODEzMTcwM30.Co6qA8Yw_yDoVQtn6ywwItl4qzEh6PKuPjkFbKq8nmI
```

### 3. Set Up Supabase Database

1. Go to your Supabase project: https://supabase.com/dashboard/project/jjxwridpyplxqlefibni
2. Navigate to the SQL Editor
3. Copy the entire contents of `supabase-schema.sql`
4. Paste and run it in the SQL Editor

This will create:
- All necessary tables (profiles, toys, sack_items, receiver_points)
- Row Level Security policies
- Database functions for adding/removing toys from sacks
- Triggers for automatic user profile creation

### 4. Create Storage Bucket

1. In your Supabase dashboard, go to Storage
2. Create a new bucket named `toy-images`
3. Make it a **Public bucket**
4. Go back to SQL Editor and run these storage policies:

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

### 5. Create Initial Admin Account

1. In Supabase Dashboard, go to Authentication > Users
2. Click "Add user" > "Create new user"
3. Set:
   - Email: `admin@tradetoys.ca` (or your preferred admin email)
   - Password: (choose a secure password)
   - Auto Confirm User: **Yes**
4. After creating, click on the user to edit
5. Go to "User Metadata" (Raw JSON) and add:

```json
{
  "full_name": "Admin",
  "role": "admin"
}
```

6. Save the user

### 6. Run the Application

```bash
npm run dev
```

The app will be available at http://localhost:3000

## 📖 How to Use

### First Time Setup

1. **Login as Admin**
   - Go to http://localhost:3000/login
   - Use your admin credentials

2. **Create User Accounts**
   - Donators can self-register or admin can create them
   - Receivers MUST be created by admin with allocated points
   - Navigate to Admin Dashboard > Users tab
   - Click "Create User"
   - For receivers, set initial point allocation (e.g., 100 points)

3. **Donators Upload Toys**
   - Donators log in and navigate to their dashboard
   - Click "Donate a Toy"
   - Upload image, add title, description
   - Set point value (suggested: 5-15 for small toys, 15-30 for medium, 30+ for large)

4. **Receivers Browse and Select**
   - Receivers log in to see the marketplace
   - Browse available toys
   - Click "Add to Sack" to claim toys
   - Points are automatically deducted
   - View "Santa's Sack" to see selected toys

5. **Admin Monitors**
   - View all users and manage points
   - See all toys in the system
   - Track which toys are in each receiver's sack

## 🎁 User Roles

### Donator
- Can upload toys with images
- Sets point values for toys
- Views their donation history
- Sees which toys have been claimed

### Receiver
- Views available toys in marketplace
- Has allocated point balance
- Adds toys to "Santa's Sack"
- Cannot register themselves (admin-created only)

### Admin
- Creates all user accounts
- Manages receiver point allocations
- Views all toys and sacks
- Full system oversight

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (React)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS with custom Christmas theme
- **Language**: TypeScript
- **Image Storage**: Supabase Storage (1GB free tier)

## 📁 Project Structure

```
├── app/
│   ├── admin/          # Admin dashboard
│   ├── donator/        # Donator interface
│   ├── receiver/       # Receiver marketplace
│   ├── login/          # Login page
│   ├── page.tsx        # Root redirect
│   ├── layout.tsx      # App layout
│   └── globals.css     # Global styles
├── components/
│   └── Header.tsx      # Shared header component
├── lib/
│   ├── supabase.ts     # Supabase client & types
│   └── auth.ts         # Authentication helpers
├── supabase-schema.sql # Database schema
└── README.md
```

## 🎨 Customization

### Adjust Point Values
Admins can update receiver points directly in the admin dashboard.

### Modify Theme Colors
Edit `tailwind.config.js` to change the Christmas color scheme:

```javascript
colors: {
  christmas: {
    red: '#DC2626',
    green: '#059669',
    darkgreen: '#047857',
    // ... add more colors
  }
}
```

### Storage Limits
The free Supabase tier includes 1GB of storage. Monitor usage in the Supabase dashboard. For more storage, upgrade your Supabase plan.

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Users can only access data relevant to their role
- Receivers can only view their own sacks
- Donators can only edit their own toys
- Admins have full access

## ⚠️ Important Notes

1. **Receivers cannot self-register** - They must be created by an admin
2. **Toys are claimed, not reserved** - Once added to a sack, toys are removed from marketplace
3. **Points are deducted immediately** - When a toy is added to a sack
4. **Image uploads require authentication** - Users must be logged in as donators

## 🎄 Christmas Features

- Festive red, green, white color scheme
- "Santa's Sack" metaphor for shopping cart
- Point-based "gift selection" system
- Christmas-themed UI elements and emojis
- Gift card-style toy displays
- Candy cane borders and decorative elements

## 📞 Support

For issues or questions about the platform, contact your system administrator.

## 🎅 Merry Christmas!

Thank you for helping spread joy this holiday season! 🎄🎁

