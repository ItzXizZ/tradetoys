-- TradeToys.ca Supabase Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'donator', 'receiver');

-- Create enum for toy status
CREATE TYPE toy_status AS ENUM ('available', 'reserved', 'claimed');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'donator',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Receiver points table
CREATE TABLE public.receiver_points (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_points INTEGER NOT NULL DEFAULT 0,
    used_points INTEGER NOT NULL DEFAULT 0,
    available_points INTEGER GENERATED ALWAYS AS (total_points - used_points) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(receiver_id)
);

-- Toys table
CREATE TABLE public.toys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    status toy_status NOT NULL DEFAULT 'available',
    donator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Santa's Sack (reserved/claimed toys by receivers)
CREATE TABLE public.sack_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    toy_id UUID REFERENCES public.toys(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(toy_id)
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receiver_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sack_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by authenticated users" 
    ON public.profiles FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Receiver points policies
CREATE POLICY "Receivers can view their own points" 
    ON public.receiver_points FOR SELECT 
    USING (auth.uid() = receiver_id);

CREATE POLICY "Admins can view all points" 
    ON public.receiver_points FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert receiver points" 
    ON public.receiver_points FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update receiver points" 
    ON public.receiver_points FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Toys policies
CREATE POLICY "Anyone authenticated can view available toys" 
    ON public.toys FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Donators can insert toys" 
    ON public.toys FOR INSERT 
    WITH CHECK (
        auth.uid() = donator_id AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'donator'
        )
    );

CREATE POLICY "Donators can update their own toys" 
    ON public.toys FOR UPDATE 
    USING (auth.uid() = donator_id);

CREATE POLICY "Admins can update any toy" 
    ON public.toys FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Sack items policies
CREATE POLICY "Receivers can view their own sack" 
    ON public.sack_items FOR SELECT 
    USING (auth.uid() = receiver_id);

CREATE POLICY "Admins can view all sacks" 
    ON public.sack_items FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Receivers can add to their sack" 
    ON public.sack_items FOR INSERT 
    WITH CHECK (
        auth.uid() = receiver_id AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'receiver'
        )
    );

CREATE POLICY "Receivers can remove from their sack" 
    ON public.sack_items FOR DELETE 
    USING (auth.uid() = receiver_id);

-- Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receiver_points_updated_at BEFORE UPDATE ON public.receiver_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_toys_updated_at BEFORE UPDATE ON public.toys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'donator')
    );
    
    -- If user is a receiver, create their points record
    IF COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'donator') = 'receiver' THEN
        INSERT INTO public.receiver_points (receiver_id, total_points)
        VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'points')::INTEGER, 0));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to add toy to sack (handles points and status)
CREATE OR REPLACE FUNCTION public.add_toy_to_sack(
    p_receiver_id UUID,
    p_toy_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_toy_points INTEGER;
    v_available_points INTEGER;
    v_toy_status toy_status;
BEGIN
    -- Get toy details
    SELECT points, status INTO v_toy_points, v_toy_status
    FROM public.toys
    WHERE id = p_toy_id;
    
    -- Check if toy exists
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Toy not found');
    END IF;
    
    -- Check if toy is available
    IF v_toy_status != 'available' THEN
        RETURN json_build_object('success', false, 'error', 'Toy is no longer available');
    END IF;
    
    -- Get receiver's available points
    SELECT available_points INTO v_available_points
    FROM public.receiver_points
    WHERE receiver_id = p_receiver_id;
    
    -- Check if receiver has enough points
    IF v_available_points < v_toy_points THEN
        RETURN json_build_object('success', false, 'error', 'Not enough points');
    END IF;
    
    -- Add toy to sack
    INSERT INTO public.sack_items (receiver_id, toy_id)
    VALUES (p_receiver_id, p_toy_id);
    
    -- Update toy status
    UPDATE public.toys
    SET status = 'claimed'
    WHERE id = p_toy_id;
    
    -- Update receiver points
    UPDATE public.receiver_points
    SET used_points = used_points + v_toy_points
    WHERE receiver_id = p_receiver_id;
    
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove toy from sack
CREATE OR REPLACE FUNCTION public.remove_toy_from_sack(
    p_receiver_id UUID,
    p_toy_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_toy_points INTEGER;
BEGIN
    -- Get toy points
    SELECT points INTO v_toy_points
    FROM public.toys
    WHERE id = p_toy_id;
    
    -- Remove from sack
    DELETE FROM public.sack_items
    WHERE receiver_id = p_receiver_id AND toy_id = p_toy_id;
    
    -- Update toy status back to available
    UPDATE public.toys
    SET status = 'available'
    WHERE id = p_toy_id;
    
    -- Refund points
    UPDATE public.receiver_points
    SET used_points = used_points - v_toy_points
    WHERE receiver_id = p_receiver_id;
    
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage bucket for toy images
-- Note: Create this bucket in Supabase Dashboard under Storage
-- Bucket name: toy-images
-- Public bucket: Yes
-- Run these commands in the SQL editor after creating the bucket:

-- Storage policies (run after creating 'toy-images' bucket in dashboard)
-- CREATE POLICY "Anyone can view toy images" ON storage.objects
--     FOR SELECT USING (bucket_id = 'toy-images');

-- CREATE POLICY "Donators can upload toy images" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'toy-images' AND
--         EXISTS (
--             SELECT 1 FROM public.profiles 
--             WHERE profiles.id = auth.uid() AND profiles.role = 'donator'
--         )
--     );

-- CREATE POLICY "Donators can update their toy images" ON storage.objects
--     FOR UPDATE USING (
--         bucket_id = 'toy-images' AND
--         EXISTS (
--             SELECT 1 FROM public.profiles 
--             WHERE profiles.id = auth.uid() AND profiles.role = 'donator'
--         )
--     );

-- INSERT DEFAULT ADMIN USER (Update password after first login!)
-- This creates an admin account. You'll need to set the password in Supabase Auth dashboard
-- Email: admin@tradetoys.ca
-- Or use the Supabase dashboard to create the admin user manually with role 'admin' in metadata

