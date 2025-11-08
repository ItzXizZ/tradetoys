'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Profile, Toy, SackItem, ReceiverPoints } from '@/lib/supabase'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import Header from '@/components/Header'

export default function ReceiverPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [availableToys, setAvailableToys] = useState<Toy[]>([])
  const [sackItems, setSackItems] = useState<SackItem[]>([])
  const [points, setPoints] = useState<ReceiverPoints | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedToy, setSelectedToy] = useState<Toy | null>(null)
  const [showSack, setShowSack] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

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
    
    if (!userProfile || userProfile.role !== 'receiver') {
      router.push('/login')
      return
    }

    setProfile(userProfile)
    await Promise.all([
      loadAvailableToys(),
      loadSackItems(user.id),
      loadPoints(user.id)
    ])
    setLoading(false)
  }

  async function loadAvailableToys() {
    const { data, error } = await supabase
      .from('toys')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setAvailableToys(data)
    }
  }

  async function loadSackItems(receiverId: string) {
    const { data, error } = await supabase
      .from('sack_items')
      .select(`
        *,
        toy:toys(*)
      `)
      .eq('receiver_id', receiverId)

    if (!error && data) {
      setSackItems(data as any)
    }
  }

  async function loadPoints(receiverId: string) {
    const { data, error } = await supabase
      .from('receiver_points')
      .select('*')
      .eq('receiver_id', receiverId)
      .single()

    if (!error && data) {
      setPoints(data)
    }
  }

  async function addToSack(toy: Toy) {
    if (!profile) return
    
    setActionLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.rpc('add_toy_to_sack', {
        p_receiver_id: profile.id,
        p_toy_id: toy.id
      })

      if (error) throw error

      const result = data as { success: boolean; error?: string }
      
      if (!result.success) {
        setError(result.error || 'Failed to add toy to sack')
      } else {
        // Reload data
        await Promise.all([
          loadAvailableToys(),
          loadSackItems(profile.id),
          loadPoints(profile.id)
        ])
        setSelectedToy(null)
      }
    } catch (err: any) {
      setError(err.message)
    }

    setActionLoading(false)
  }

  async function removeFromSack(toyId: string) {
    if (!profile) return
    
    setActionLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.rpc('remove_toy_from_sack', {
        p_receiver_id: profile.id,
        p_toy_id: toyId
      })

      if (error) throw error

      // Reload data
      await Promise.all([
        loadAvailableToys(),
        loadSackItems(profile.id),
        loadPoints(profile.id)
      ])
    } catch (err: any) {
      setError(err.message)
    }

    setActionLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold text-christmas-red">
          Loading...
        </div>
      </div>
    )
  }

  if (!profile || !points) return null

  const sackTotalPoints = sackItems.reduce((sum, item) => {
    return sum + (item.toy?.points || 0)
  }, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50">
      <Header profile={profile} />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 christmas-card p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-christmas-red mb-2">
                Christmas Toy Marketplace
              </h2>
              <p className="text-gray-700">
                Select toys for your children using your available points!
              </p>
            </div>
            <div className="text-right">
              <div className="bg-christmas-gold text-white px-6 py-3 rounded-lg mb-2">
                <p className="text-sm font-bold">Your Points</p>
                <p className="text-3xl font-bold">{points.available_points}</p>
              </div>
              <button
                onClick={() => setShowSack(!showSack)}
                className="santa-button relative"
              >
                🎅 Santa's Sack ({sackItems.length})
                {sackItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-christmas-green text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {sackItems.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Santa's Sack Modal */}
        {showSack && (
          <div className="mb-8 christmas-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-christmas-red">
                🎅 Santa's Sack
              </h3>
              <button
                onClick={() => setShowSack(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {sackItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-xl">Your sack is empty!</p>
                <p>Add toys from the marketplace below.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {sackItems.map((item) => item.toy && (
                    <div key={item.id} className="christmas-card p-4 flex gap-4">
                      <img
                        src={item.toy.image_url}
                        alt={item.toy.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">{item.toy.title}</h4>
                        <p className="text-christmas-gold font-bold">{item.toy.points} points</p>
                        <button
                          onClick={() => removeFromSack(item.toy!.id)}
                          disabled={actionLoading}
                          className="mt-2 text-sm text-red-600 hover:text-red-800 font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t-2 border-christmas-red pt-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total Points Used:</span>
                    <span className="text-christmas-gold">{sackTotalPoints}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Available Toys */}
        <div className="christmas-card p-6">
          <h3 className="text-2xl font-bold text-christmas-green mb-6">
            Available Toys ({availableToys.length})
          </h3>

          {availableToys.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl mb-2">No toys available yet</p>
              <p>Check back soon for new donations!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableToys.map((toy) => (
                <div key={toy.id} className="gift-card christmas-card p-4">
                  <img
                    src={toy.image_url}
                    alt={toy.title}
                    className="w-full h-48 object-cover rounded-lg mb-3 cursor-pointer"
                    onClick={() => setSelectedToy(toy)}
                  />
                  <h4 className="font-bold text-lg text-gray-800 mb-1">
                    {toy.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {toy.description || 'No description'}
                  </p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-christmas-gold font-bold text-lg">
                      {toy.points} points
                    </span>
                  </div>
                  <button
                    onClick={() => addToSack(toy)}
                    disabled={actionLoading || points.available_points < toy.points}
                    className="santa-button w-full"
                  >
                    {points.available_points < toy.points 
                      ? 'Not Enough Points' 
                      : 'Add to Sack'}
                  </button>
                  <button
                    onClick={() => setSelectedToy(toy)}
                    className="elf-button w-full mt-2"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Toy Detail Modal */}
        {selectedToy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="christmas-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-christmas-red">
                  {selectedToy.title}
                </h3>
                <button
                  onClick={() => setSelectedToy(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <img
                src={selectedToy.image_url}
                alt={selectedToy.title}
                className="w-full h-96 object-cover rounded-lg mb-4"
              />
              <div className="mb-4">
                <h4 className="font-bold text-lg mb-2">Description:</h4>
                <p className="text-gray-700">
                  {selectedToy.description || 'No description provided'}
                </p>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-christmas-gold font-bold text-2xl">
                  {selectedToy.points} points
                </span>
              </div>
              <button
                onClick={() => {
                  addToSack(selectedToy)
                }}
                disabled={actionLoading || points.available_points < selectedToy.points}
                className="santa-button w-full text-lg"
              >
                {points.available_points < selectedToy.points 
                  ? 'Not Enough Points' 
                  : 'Add to Santa\'s Sack'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

