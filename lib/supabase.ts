import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'admin' | 'donator' | 'receiver'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface ReceiverPoints {
  id: string
  receiver_id: string
  total_points: number
  used_points: number
  available_points: number
  created_at: string
  updated_at: string
}

export type ToyStatus = 'available' | 'reserved' | 'claimed'

export interface Toy {
  id: string
  title: string
  description: string | null
  points: number
  image_url: string
  status: ToyStatus
  donator_id: string | null
  created_at: string
  updated_at: string
}

export interface SackItem {
  id: string
  receiver_id: string
  toy_id: string
  added_at: string
  toy?: Toy
}

