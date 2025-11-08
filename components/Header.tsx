'use client'

import { signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { Profile } from '@/lib/supabase'

interface HeaderProps {
  profile: Profile
}

export default function Header({ profile }: HeaderProps) {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  const roleEmoji = {
    admin: '👑',
    donator: '🎁',
    receiver: '🎄'
  }

  const roleLabel = {
    admin: 'Admin',
    donator: 'Donator',
    receiver: 'Receiver'
  }

  return (
    <header className="bg-white border-b-4 border-christmas-red shadow-lg">
      <div className="candy-cane-border"></div>
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-christmas-red">
              🎅 TradeToys.ca
            </h1>
            <p className="text-christmas-green text-sm">
              {roleEmoji[profile.role]} {roleLabel[profile.role]} Portal
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-bold text-gray-700">{profile.full_name}</p>
              <p className="text-sm text-gray-500">{profile.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="elf-button"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

