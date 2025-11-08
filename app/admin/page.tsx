'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Profile, Toy, SackItem, ReceiverPoints, UserRole } from '@/lib/supabase'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import Header from '@/components/Header'

export default function AdminPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'toys' | 'sacks'>('users')
  
  // Users tab
  const [users, setUsers] = useState<Profile[]>([])
  const [receiverPoints, setReceiverPoints] = useState<ReceiverPoints[]>([])
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<UserRole>('receiver')
  const [newUserPoints, setNewUserPoints] = useState(100)
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)
  
  // Toys tab
  const [allToys, setAllToys] = useState<Toy[]>([])
  
  // Sacks tab
  const [allSacks, setAllSacks] = useState<{
    receiver: Profile
    points: ReceiverPoints
    items: (SackItem & { toy: Toy })[]
  }[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const user = await getCurrentUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const userProfile = await getUserProfile(user.id)
    
    if (!userProfile || userProfile.role !== 'admin') {
      router.push('/login')
      return
    }

    setProfile(userProfile)
    await loadAllData()
    setLoading(false)
  }

  async function loadAllData() {
    await Promise.all([
      loadUsers(),
      loadToys(),
      loadSacks()
    ])
  }

  async function loadUsers() {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesData) {
      setUsers(profilesData)
    }

    const { data: pointsData } = await supabase
      .from('receiver_points')
      .select('*')

    if (pointsData) {
      setReceiverPoints(pointsData)
    }
  }

  async function loadToys() {
    const { data } = await supabase
      .from('toys')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setAllToys(data)
    }
  }

  async function loadSacks() {
    // Get all receivers
    const { data: receivers } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'receiver')

    if (!receivers) return

    const sacksData = await Promise.all(
      receivers.map(async (receiver) => {
        const { data: items } = await supabase
          .from('sack_items')
          .select(`
            *,
            toy:toys(*)
          `)
          .eq('receiver_id', receiver.id)

        const { data: points } = await supabase
          .from('receiver_points')
          .select('*')
          .eq('receiver_id', receiver.id)
          .single()

        return {
          receiver,
          points: points || { total_points: 0, used_points: 0, available_points: 0 } as ReceiverPoints,
          items: (items || []) as any
        }
      })
    )

    setAllSacks(sacksData)
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    setCreating(true)

    try {
      // Create user via Supabase Admin API
      const metadata: any = {
        full_name: newUserName,
        role: newUserRole,
      }
      
      if (newUserRole === 'receiver') {
        metadata.points = newUserPoints
      }

      const { data, error } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          emailRedirectTo: window.location.origin,
          data: metadata
        }
      })
      
      // Note: Email confirmation must be disabled in Supabase Auth settings
      // Or users must be created with "Auto Confirm" in the dashboard

      if (error) throw error

      // Reset form
      setNewUserEmail('')
      setNewUserName('')
      setNewUserPassword('')
      setNewUserRole('receiver')
      setNewUserPoints(100)
      setShowCreateUser(false)
      
      // Reload users
      await loadUsers()
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create user')
    }

    setCreating(false)
  }

  async function updateReceiverPoints(receiverId: string, newPoints: number) {
    const { error } = await supabase
      .from('receiver_points')
      .update({ total_points: newPoints })
      .eq('receiver_id', receiverId)

    if (!error) {
      await loadUsers()
      await loadSacks()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-christmas-red">
          🎄 Loading...
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50">
      <Header profile={profile} />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 christmas-card p-6">
          <h2 className="text-3xl font-bold text-christmas-red mb-2">
            👑 Admin Dashboard
          </h2>
          <p className="text-gray-700">
            Manage users, monitor toys, and track Santa's Sacks
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'users'
                ? 'santa-button'
                : 'bg-white text-gray-700 border-2 border-christmas-red'
            }`}
          >
            👥 Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('toys')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'toys'
                ? 'santa-button'
                : 'bg-white text-gray-700 border-2 border-christmas-red'
            }`}
          >
            🎁 All Toys ({allToys.length})
          </button>
          <button
            onClick={() => setActiveTab('sacks')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'sacks'
                ? 'santa-button'
                : 'bg-white text-gray-700 border-2 border-christmas-red'
            }`}
          >
            🎅 Santa's Sacks
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="christmas-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-christmas-green">
                User Management
              </h3>
              <button
                onClick={() => setShowCreateUser(!showCreateUser)}
                className="santa-button"
              >
                {showCreateUser ? '❌ Cancel' : '➕ Create User'}
              </button>
            </div>

            {showCreateUser && (
              <div className="mb-6 p-6 bg-green-50 rounded-lg border-2 border-christmas-green">
                <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                  <p className="text-sm font-bold text-yellow-800 mb-2">
                    ⚠️ Important: Email Confirmation Must Be Disabled
                  </p>
                  <p className="text-xs text-yellow-700 mb-2">
                    For users to login immediately, disable email confirmation in{' '}
                    <a 
                      href="https://supabase.com/dashboard/project/jjxwridpyplxqlefibni/auth/providers" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold"
                    >
                      Supabase Auth Settings
                    </a>
                    {' '}(Authentication → Providers → Email → Turn OFF "Confirm email")
                  </p>
                  <p className="text-xs text-yellow-700">
                    Or create users directly in the{' '}
                    <a 
                      href="https://supabase.com/dashboard/project/jjxwridpyplxqlefibni/auth/users" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold"
                    >
                      Supabase Dashboard
                    </a>
                    {' '}with "Auto Confirm User" checked. See FIX_EMAIL_CONFIRMATION.md for details.
                  </p>
                </div>
                <h4 className="text-xl font-bold text-christmas-green mb-4">
                  Create New User Account (May require email confirmation)
                </h4>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2 border-2 border-christmas-green rounded-lg focus:outline-none focus:ring-2 focus:ring-christmas-red"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        required
                        className="w-full px-4 py-2 border-2 border-christmas-green rounded-lg focus:outline-none focus:ring-2 focus:ring-christmas-red"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-4 py-2 border-2 border-christmas-green rounded-lg focus:outline-none focus:ring-2 focus:ring-christmas-red"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Role *
                      </label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                        className="w-full px-4 py-2 border-2 border-christmas-green rounded-lg focus:outline-none focus:ring-2 focus:ring-christmas-red"
                      >
                        <option value="receiver">Receiver (Family)</option>
                        <option value="donator">Donator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    {newUserRole === 'receiver' && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Initial Points *
                        </label>
                        <input
                          type="number"
                          value={newUserPoints}
                          onChange={(e) => setNewUserPoints(parseInt(e.target.value))}
                          required
                          min={0}
                          className="w-full px-4 py-2 border-2 border-christmas-green rounded-lg focus:outline-none focus:ring-2 focus:ring-christmas-red"
                        />
                      </div>
                    )}
                  </div>

                  {createError && (
                    <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg">
                      {createError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={creating}
                    className="santa-button w-full"
                  >
                    {creating ? '⏳ Creating...' : '✅ Create User'}
                  </button>
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-christmas-red">
                    <th className="text-left py-3 px-4 font-bold">Name</th>
                    <th className="text-left py-3 px-4 font-bold">Email</th>
                    <th className="text-left py-3 px-4 font-bold">Role</th>
                    <th className="text-left py-3 px-4 font-bold">Points</th>
                    <th className="text-left py-3 px-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const userPoints = receiverPoints.find(p => p.receiver_id === user.id)
                    return (
                      <tr key={user.id} className="border-b border-gray-200">
                        <td className="py-3 px-4">{user.full_name}</td>
                        <td className="py-3 px-4">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-700'
                              : user.role === 'donator'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {user.role === 'admin' ? '👑' : user.role === 'donator' ? '🎁' : '🎄'} {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {user.role === 'receiver' && userPoints ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                defaultValue={userPoints.total_points}
                                onBlur={(e) => updateReceiverPoints(user.id, parseInt(e.target.value))}
                                className="w-24 px-2 py-1 border-2 border-christmas-green rounded"
                              />
                              <span className="text-sm text-gray-600">
                                (Used: {userPoints.used_points})
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Toys Tab */}
        {activeTab === 'toys' && (
          <div className="christmas-card p-6">
            <h3 className="text-2xl font-bold text-christmas-green mb-6">
              All Toys in System
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allToys.map((toy) => (
                <div key={toy.id} className="gift-card christmas-card p-4">
                  <img
                    src={toy.image_url}
                    alt={toy.title}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                  <h4 className="font-bold text-lg text-gray-800 mb-1">
                    {toy.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {toy.description || 'No description'}
                  </p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-christmas-gold font-bold">
                      ⭐ {toy.points} points
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      toy.status === 'available' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {toy.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Donated: {new Date(toy.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sacks Tab */}
        {activeTab === 'sacks' && (
          <div className="space-y-6">
            {allSacks.map((sack) => {
              const totalPoints = sack.items.reduce((sum, item) => sum + item.toy.points, 0)
              return (
                <div key={sack.receiver.id} className="christmas-card p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-christmas-red">
                        🎄 {sack.receiver.full_name}
                      </h3>
                      <p className="text-gray-600">{sack.receiver.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="bg-christmas-gold text-white px-4 py-2 rounded-lg">
                        <p className="text-xs font-bold">Points</p>
                        <p className="text-lg font-bold">
                          {sack.points.available_points} / {sack.points.total_points}
                        </p>
                      </div>
                    </div>
                  </div>

                  {sack.items.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      No toys in sack yet
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {sack.items.map((item) => (
                          <div key={item.id} className="christmas-card p-3 flex gap-3">
                            <img
                              src={item.toy.image_url}
                              alt={item.toy.title}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                            <div>
                              <h5 className="font-bold text-sm">{item.toy.title}</h5>
                              <p className="text-christmas-gold text-sm font-bold">
                                ⭐ {item.toy.points} pts
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="border-t-2 border-christmas-red pt-3">
                        <div className="flex justify-between items-center font-bold">
                          <span>Total Items: {sack.items.length}</span>
                          <span className="text-christmas-gold">
                            Total Points: ⭐ {totalPoints}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )
            })}

            {allSacks.length === 0 && (
              <div className="christmas-card p-12 text-center text-gray-500">
                <p className="text-xl">No receivers with sacks yet</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

