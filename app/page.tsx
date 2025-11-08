'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Get user profile to determine role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        switch (profile.role) {
          case 'admin':
            router.push('/admin')
            break
          case 'donator':
            router.push('/donator')
            break
          case 'receiver':
            router.push('/receiver')
            break
        }
      }
    } else {
      router.push('/login')
    }
    
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-christmas-red">
          🎄 Loading TradeToys.ca...
        </div>
      </div>
    )
  }

  return null
}

