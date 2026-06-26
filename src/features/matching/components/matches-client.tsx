'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react'
import { 
  Heart, ShieldCheck, Crown, MapPin, Briefcase, 
  GraduationCap, Sparkles, UserCheck, Bookmark, Lock, Loader2, ArrowRight,
  Search
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchMatches, sendInterest, toggleShortlist, getMyInteractionStatus, fetchProfileById } from '../actions/match-actions'
import type { Profile } from '@/types/database'

// Left Sidebar categories
const CATEGORIES = [
  { id: 'recommended', label: 'Recommended Matches', icon: Sparkles, desc: 'AI-compatibility matching' },
  { id: 'recently_joined', label: 'Recently Joined', icon: Bookmark, desc: 'Newest verified profiles' },
  { id: 'near_you', label: 'Near You', icon: MapPin, desc: 'Profiles in your state' },
  { id: 'verified', label: 'Verified Profiles', icon: ShieldCheck, desc: '100% KYC verified matches' },
  { id: 'premium', label: 'Elite Premium Members', icon: Crown, desc: 'Elite club members' },
  { id: 'saved', label: 'Saved Matches', icon: Heart, desc: 'Shortlisted profiles' }
]

interface MatchesClientProps {
  initialCategory?: string
  isPremium?: boolean
}

export function MatchesClient({ initialCategory = 'recommended', isPremium: _isPremium = false }: MatchesClientProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set())
  const [interestsSentIds, setInterestsSentIds] = useState<Set<string>>(new Set())
  const [sendingInterestId, setSendingInterestId] = useState<string | null>(null)
  const [searchId, setSearchId] = useState('')
  const [isSearchingById, setIsSearchingById] = useState(false)
  const [searchResultActive, setSearchResultActive] = useState(false)

  // Load initial interaction statuses (shortlist & interests sent) on mount
  useEffect(() => {
    async function loadInteractions() {
      try {
        const result = await getMyInteractionStatus()
        if (result && !('error' in result)) {
          setShortlistedIds(new Set(result.shortlisted))
          setInterestsSentIds(new Set(result.interestsSent))
        }
      } catch (err) {
        console.error('Failed to load interaction statuses:', err)
      }
    }
    loadInteractions()
  }, [])

  // Load matches when active tab changes
  useEffect(() => {
    async function loadMatches() {
      setIsLoading(true)
      try {
        const result = await fetchMatches(activeCategory)
        if (result.error) {
          toast.error(result.error)
        } else {
          setProfiles(result.data || [])
          setSearchResultActive(false)
          setSearchId('')
        }
      } catch {
        toast.error('Error fetching matrimonial matches.')
      } finally {
        setIsLoading(false)
      }
    }
    loadMatches()
  }, [activeCategory])

  const handleSearchById = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchId.trim()
    if (!trimmed) {
      toast.error('Please enter a Profile ID.')
      return
    }

    setIsSearchingById(true)
    try {
      const result = await fetchProfileById(trimmed)
      if (result.error) {
        toast.error(result.error)
      } else if (result.data) {
        setProfiles(result.data)
        setSearchResultActive(true)
        toast.success('Profile found!')
      }
    } catch {
      toast.error('Error searching for profile.')
    } finally {
      setIsSearchingById(false)
    }
  }

  const handleResetSearch = async () => {
    setSearchId('')
    setSearchResultActive(false)
    setIsLoading(true)
    try {
      const result = await fetchMatches(activeCategory)
      if (result.error) {
        toast.error(result.error)
      } else {
        setProfiles(result.data || [])
      }
    } catch {
      toast.error('Error fetching matrimonial matches.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Shortlisting
  const handleToggleShortlist = async (targetId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const result = await toggleShortlist(targetId, 'Favorites', 'Shortlisted from feed')
      if (result.error) {
        toast.error(result.error)
      } else {
        const updated = new Set(shortlistedIds)
        if (result.shortlisted) {
          updated.add(targetId)
          toast.success('Profile added to shortlist!')
        } else {
          updated.delete(targetId)
          toast.success('Profile removed from shortlist.')
          // Remove from list if viewing saved matches
          if (activeCategory === 'saved') {
            setProfiles((prev) => prev.filter((p) => p.id !== targetId))
          }
        }
        setShortlistedIds(updated)
      }
    } catch {
      toast.error('Failed to update shortlist.')
    }
  }

  // Handle Expressing Interest
  const handleExpressInterest = async (targetId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (interestsSentIds.has(targetId)) return

    setSendingInterestId(targetId)
    try {
      const result = await sendInterest(targetId)
      if (result.error) {
        toast.error(result.error)
      } else {
        const updated = new Set(interestsSentIds)
        updated.add(targetId)
        setInterestsSentIds(updated)
        toast.success(`Matrimonial interest invitation sent to ${name}!`)
      }
    } catch {
      toast.error('Failed to express interest.')
    } finally {
      setSendingInterestId(null)
    }
  }

  const getAge = (dob: string) => {
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar categories panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl p-4 shadow-md">
            <h2 className="text-sm font-black uppercase text-pink-600 tracking-wider mb-4 px-2">Matches Center</h2>
            <div className="flex flex-col gap-1">
              {CATEGORIES.map((cat) => {
                const CatIcon = cat.icon
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-3 w-full text-left p-3 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-pink-50 dark:bg-pink-950/20 text-pink-600 font-bold border-l-4 border-pink-600 pl-2'
                        : 'text-zinc-650 hover:bg-zinc-50 dark:text-zinc-350 dark:hover:bg-zinc-850'
                    }`}
                  >
                    <CatIcon className={`h-5 w-5 shrink-0 ${isActive ? 'text-pink-600' : 'text-zinc-400'}`} />
                    <div className="min-w-0">
                      <p className="text-xs truncate">{cat.label}</p>
                      <p className="text-[9px] text-zinc-400 dark:text-zinc-500 truncate">{cat.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Matches Feed Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-200/50 pb-4 gap-4">
            <div>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight font-heading capitalize">
                {searchResultActive ? 'Search Result' : activeCategory.replace('_', ' ')}
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                {searchResultActive 
                  ? `Showing candidate for profile ID: ${searchId}` 
                  : 'Displaying matrimonial profiles suited for your account.'}
              </p>
            </div>

            {/* Profile ID Search Bar */}
            <form onSubmit={handleSearchById} className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by Profile ID (UUID)..."
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all text-zinc-850 dark:text-zinc-150 placeholder:text-zinc-400"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={isSearchingById}
                className="bg-pink-600 hover:bg-pink-700 text-white font-bold h-9 px-4 rounded-xl text-xs flex items-center gap-1.5"
              >
                {isSearchingById ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Search className="h-3.5 w-3.5" />
                    Search
                  </>
                )}
              </Button>
              {searchResultActive && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleResetSearch}
                  className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-350 h-9 px-3 rounded-xl text-xs flex items-center gap-1"
                  title="Clear search"
                >
                  Clear
                </Button>
              )}
            </form>
          </div>

          {isLoading ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
                <p className="text-xs text-zinc-500 font-semibold">Fetching matrimonial matches...</p>
              </div>
            </div>
          ) : profiles.length === 0 ? (
            <div className="min-h-[350px] bg-white border border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center shadow-sm">
              <Heart className="h-12 w-12 text-zinc-350 mb-3 stroke-[1.5px]" />
              <h3 className="font-bold text-zinc-800 text-sm">No Matches Found</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                We couldn&apos;t find any profiles under this category. Update your partner preferences in Settings to discover more candidates.
              </p>
              <Link href="/profile" className="mt-4">
                <Button className="bg-pink-600 hover:bg-pink-700 text-white font-bold h-9 px-4 rounded-lg text-xs flex items-center gap-1">
                  Adjust Preferences
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {profiles.map((profile) => {
                const age = getAge(profile.date_of_birth)
                const isPhotoBlurred = profile.photos?.[0] === '/logo/blurred-photo-placeholder.jpg'
                const displayPhoto = profile.photos?.[0] || profile.avatar_url || '/logo/blurred-photo-placeholder.jpg'
                const isShortlisted = shortlistedIds.has(profile.id) || activeCategory === 'saved'
                const interestSent = interestsSentIds.has(profile.id)

                return (
                  <Card 
                    key={profile.id}
                    className="group relative overflow-hidden rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] flex flex-col h-full"
                  >
                    {/* Image block */}
                    <div className="relative aspect-[4/5] w-full bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
                      <img
                        src={displayPhoto}
                        alt={`${profile.first_name} ${profile.last_name}`}
                        className={`object-cover h-full w-full transition-transform duration-500 group-hover:scale-105 ${
                          isPhotoBlurred ? 'blur-[8px]' : ''
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                      {/* Compatibility match rating */}
                      <div className="absolute top-3 left-3 bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Heart className="h-2.5 w-2.5 fill-white text-white" />
                        <span>85% Match</span>
                      </div>

                      {/* Badges and Shortlist button overlay */}
                      <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                        <button
                          onClick={(e) => handleToggleShortlist(profile.id, e)}
                          className={`p-2 rounded-full backdrop-blur-md border shadow-sm transition-all duration-300 hover:scale-110 ${
                            isShortlisted 
                              ? 'bg-rose-50 border-rose-200 text-rose-600' 
                              : 'bg-white/70 border-white/20 text-zinc-700 hover:bg-white hover:text-rose-600'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${isShortlisted ? 'fill-current' : ''}`} />
                        </button>
                        {profile.is_premium && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold text-[9px] px-1.5 py-0.5 border border-amber-400/30 flex items-center gap-1 shadow-sm uppercase">
                            <Crown className="h-2.5 w-2.5 fill-yellow-100" />
                            Premium
                          </Badge>
                        )}
                        {profile.is_verified && (
                          <Badge className="bg-emerald-500 text-white font-bold text-[9px] px-1.5 py-0.5 border border-emerald-400/20 flex items-center gap-1 shadow-sm uppercase">
                            <ShieldCheck className="h-2.5 w-2.5 fill-emerald-100" />
                            Verified
                          </Badge>
                        )}
                      </div>

                      {/* Privacy Blur Overlay */}
                      {isPhotoBlurred && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 backdrop-blur-[12px] p-4 text-center">
                          <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-2 rounded-full mb-1">
                            <Lock className="h-5 w-5 text-pink-200" />
                          </div>
                          <p className="text-white text-[10px] font-bold uppercase tracking-wider">Photo Protected</p>
                          <p className="text-zinc-200 text-[8px] mt-0.5 max-w-[150px]">
                            Only visible to verified members or connections.
                          </p>
                        </div>
                      )}

                      {/* Details block overlay */}
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <div className="flex items-baseline gap-1.5">
                          <h4 className="text-base font-bold truncate">
                            {profile.first_name} {profile.last_name}
                          </h4>
                          <span className="text-sm opacity-90" suppressHydrationWarning>{age} yrs</span>
                        </div>
                        <p className="text-[10px] text-pink-200/90 font-medium mt-0.5">
                          {profile.religion} • {profile.caste || 'Caste open'} • {profile.mother_tongue}
                        </p>
                      </div>
                    </div>

                    {/* Meta info details */}
                    <CardContent className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                      <div className="grid grid-cols-2 gap-y-2 gap-x-1.5 text-[11px] text-zinc-650 dark:text-zinc-400">
                        <div className="flex items-center gap-1 truncate">
                          <Briefcase className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">{profile.occupation || 'Self-employed'}</span>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <GraduationCap className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">{profile.education || 'Bachelor\'s'}</span>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">{profile.city}, {profile.state}</span>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <Crown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">₹{(profile.annual_income ? profile.annual_income / 100000 : 8).toFixed(0)} Lakh/yr</span>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-2 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
                        <Link href={`/profile/${profile.id}`} className="flex-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full text-xs h-9 rounded-lg border-zinc-200 text-zinc-700 hover:text-pink-600 hover:border-pink-300"
                          >
                            View Details
                          </Button>
                        </Link>

                        <Button
                          type="button"
                          size="sm"
                          disabled={sendingInterestId === profile.id || interestSent}
                          onClick={(e) => handleExpressInterest(profile.id, profile.first_name, e)}
                          className={`flex-1 text-xs h-9 rounded-lg font-bold flex items-center justify-center gap-1 transition-all ${
                            interestSent
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-250 hover:bg-emerald-50'
                              : 'bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white shadow-sm'
                          }`}
                        >
                          {sendingInterestId === profile.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : interestSent ? (
                            <>
                              <UserCheck className="h-3.5 w-3.5 animate-bounce" />
                              Sent
                            </>
                          ) : (
                            <>
                              <Heart className="h-3.5 w-3.5 fill-current" />
                              Express
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
