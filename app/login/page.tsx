'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: signInError } = await signIn(email, password)

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Get user profile to determine role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
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
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="candy-cane-border w-full max-w-md"></div>
      
      <div className="christmas-card w-full max-w-md p-8 my-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-christmas-red mb-2">
            🎅 TradeToys.ca
          </h1>
          <p className="text-christmas-green text-lg">
            Share the Joy of Christmas
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-christmas-green rounded-lg focus:outline-none focus:ring-2 focus:ring-christmas-red"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-christmas-green rounded-lg focus:outline-none focus:ring-2 focus:ring-christmas-red"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="santa-button w-full text-lg"
          >
            {loading ? '🎄 Logging in...' : '🎁 Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-christmas-red font-bold hover:underline">
              Register as Donator
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>🎄 Donators can register themselves</p>
          <p>🎅 Receivers get accounts from admins</p>
        </div>
      </div>

      <div className="candy-cane-border w-full max-w-md"></div>
    </div>
  )
}

