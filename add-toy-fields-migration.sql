-- Migration to add new fields to existing toys table
-- Run this in your Supabase SQL Editor if you already have the toys table created

-- Create enum for toy condition if it doesn't exist
DO $$ BEGIN
    CREATE TYPE toy_condition AS ENUM ('new', 'used');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to toys table
ALTER TABLE public.toys 
ADD COLUMN IF NOT EXISTS condition toy_condition DEFAULT 'used',
ADD COLUMN IF NOT EXISTS age_range TEXT,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Update existing toys to have 'used' as default condition if null
UPDATE public.toys 
SET condition = 'used' 
WHERE condition IS NULL;

