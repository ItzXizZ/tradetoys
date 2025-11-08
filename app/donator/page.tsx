'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Profile, Toy } from '@/lib/supabase'
import { getCurrentUser, getUserProfile } from '@/lib/auth'
import Header from '@/components/Header'

export default function DonatorPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [toys, setToys] = useState<Toy[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadForm, setShowUploadForm] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [points, setPoints] = useState(10)
  const [image, setImage] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [condition, setCondition] = useState<'new' | 'used'>('used')
  const [ageRange, setAgeRange] = useState('')
  const [category, setCategory] = useState('')

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
    
    if (!userProfile || userProfile.role !== 'donator') {
      router.push('/login')
      return
    }

    setProfile(userProfile)
    loadToys(user.id)
    setLoading(false)
  }

  async function loadToys(donatorId: string) {
    const { data, error } = await supabase
      .from('toys')
      .select('*')
      .eq('donator_id', donatorId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setToys(data)
    }
  }

  async function handleUploadToy(e: React.FormEvent) {
    e.preventDefault()
    setUploadError('')
    setUploading(true)

    if (!image || !profile) {
      setUploadError('Please select an image')
      setUploading(false)
      return
    }

    try {
      // Upload image to Supabase Storage
      const fileExt = image.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('toy-images')
        .upload(filePath, image)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('toy-images')
        .getPublicUrl(filePath)

      // Insert toy into database
      const { error: insertError } = await supabase
        .from('toys')
        .insert({
          title,
          description,
          points,
          image_url: publicUrl,
          donator_id: profile.id,
          status: 'available',
          condition,
          age_range: ageRange,
          category
        })

      if (insertError) {
        throw insertError
      }

      // Reset form
      setTitle('')
      setDescription('')
      setPoints(10)
      setImage(null)
      setCondition('used')
      setAgeRange('')
      setCategory('')
      setShowUploadForm(false)
      
      // Reload toys
      loadToys(profile.id)
    } catch (error: any) {
      setUploadError(error.message)
    }

    setUploading(false)
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

  if (!profile) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50">
      <Header profile={profile} />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 christmas-card p-6">
          <h2 className="text-3xl font-bold text-christmas-red mb-2">
            Welcome, Generous Donator!
          </h2>
          <p className="text-gray-700">
            Thank you for sharing the joy of Christmas. Upload toys to help families in need.
          </p>
        </div>

        <div className="mb-8">
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="santa-button text-lg"
          >
            {showUploadForm ? 'Cancel' : 'Donate a Toy'}
          </button>
        </div>

        {showUploadForm && (
          <div className="christmas-card p-6 mb-8">
            <h3 className="text-2xl font-bold text-christmas-green mb-4">
              Upload New Toy
            </h3>
            <form onSubmit={handleUploadToy} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Toy Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 border-2 border-christmas-green rounded-lg focus:outline-none focus:ring-2 focus:ring-christmas-red"
                  placeholder="e.g., LEGO Star Wars Set"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-christmas-green rounded-lg focus:outline-none focus:ring-2 focus:ring-christmas-red"
                  placeholder="Describe the toy details..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Condition *
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as 'new' | 'used')}
                    required
                    className="w-full px-4 py-2 border-2 border-christmas-green rounded-lg focus:outline-none focus:ring-2 focus:ring-christmas-red"
                  >
                    <option value="used">Used</option>
                    <option value="new">New (Unopened)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full px-4 py-2 border-2 border-christmas-green rounded-lg focus:outline-none focus:ring-2 focus:ring-christmas-red"
                  >
                    <option value="">Select category...</option>
                    <option value="Action Figures">Action Figures</option>
                    <option value="Building Blocks">Building Blocks (LEGO, etc.)</option>
                    <option value="Dolls & Plush">Dolls & Plush Toys</option>
                    <option value="Educational">Educational Toys</option>
                    <option value="Board Games">Board Games</option>
                    <option value="Arts & Crafts">Arts & Crafts</option>
                    <option value="Outdoor & Sports">Outdoor & Sports</option>
                    <option value="Electronics">Electronic Toys</option>
                    <option value="Vehicles">Vehicles & Remote Control</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Recommended Age Range *
                  </label>
                  <select
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    required
                    className="w-full px-4 py-2 border-2 border-christmas-green rounded-lg focus:outline-none focus:ring-2 focus:ring-christmas-red"
                  >
                    <option value="">Select age range...</option>
                    <option value="0-2 years">0-2 years</option>
                    <option value="3-5 years">3-5 years</option>
                    <option value="6-8 years">6-8 years</option>
                    <option value="9-12 years">9-12 years</option>
                    <option value="13+ years">13+ years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Point Value * (How valuable is this toy?)
                  </label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value))}
                    required
                    min={1}
                    max={100}
                    className="w-full px-4 py-2 border-2 border-christmas-green rounded-lg focus:outline-none focus:ring-2 focus:ring-christmas-red"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Small: 5-15 | Medium: 15-30 | Large: 30+
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Toy Image *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  required
                  className="w-full px-4 py-2 border-2 border-christmas-green rounded-lg focus:outline-none focus:ring-2 focus:ring-christmas-red"
                />
              </div>

              {uploadError && (
                <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-lg">
                  {uploadError}
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="santa-button w-full"
              >
                {uploading ? 'Uploading...' : 'Donate This Toy'}
              </button>
            </form>
          </div>
        )}

        <div className="christmas-card p-6">
          <h3 className="text-2xl font-bold text-christmas-green mb-6">
            Your Donated Toys ({toys.length})
          </h3>

          {toys.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl mb-2">No toys donated yet</p>
              <p>Click "Donate a Toy" to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {toys.map((toy) => (
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
                  <div className="mb-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold mr-2 ${
                      toy.condition === 'new' 
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {toy.condition === 'new' ? 'New' : 'Used'}
                    </span>
                    {toy.category && (
                      <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-700">
                        {toy.category}
                      </span>
                    )}
                  </div>
                  {toy.age_range && (
                    <p className="text-xs text-gray-500 mb-2">
                      Age: {toy.age_range}
                    </p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-christmas-gold font-bold text-lg">
                      {toy.points} points
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      toy.status === 'available' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {toy.status === 'available' ? 'Available' : 'Claimed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

