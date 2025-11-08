-- Migration to add admin delete user policy
-- Run this in your Supabase SQL Editor if you already have the database set up

-- Add DELETE policy for admins on profiles table
CREATE POLICY "Admins can delete any profile" 
    ON public.profiles FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

