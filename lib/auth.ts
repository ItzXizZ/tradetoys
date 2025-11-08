import { supabase, Profile, UserRole } from './supabase'

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  
  return data
}

export async function createUserAccount(
  email: string,
  password: string,
  fullName: string,
  role: UserRole,
  points?: number
) {
  // This should only be called by admins
  const metadata: any = {
    full_name: fullName,
    role: role,
  }
  
  if (role === 'receiver' && points !== undefined) {
    metadata.points = points
  }
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  })
  
  return { data, error }
}

