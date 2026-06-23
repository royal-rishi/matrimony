'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShieldCheck, Crown, MapPin, Briefcase, GraduationCap, Heart, Lock, IndianRupee } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Profile } from '@/types/database'
import { toast } from 'sonner'

interface ProfileCardProps {
  profile: Profile
  compatibilityScore?: number
  onSendInterest?: (profileId: string) => Promise<void>
  onViewDetails?: (profileId: string) => void
}

export function ProfileCard({
  profile,
  compatibilityScore,
  onSendInterest,
  onViewDetails,
}: ProfileCardProps) {
  const [isSending, setIsSending] = useState(false)
  const [interestSent, setInterestSent] = useState(false)

  // Calculate age from date of birth
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

  const age = getAge(profile.date_of_birth)
  const isPhotoBlurred = profile.photos?.[0] === '/logo/blurred-photo-placeholder.jpg'
  const displayPhoto = profile.photos?.[0] || profile.avatar_url || '/logo/blurred-photo-placeholder.jpg'

  // Format income to Lakhs/Crores for standard Indian readability
  const formatIncome = (income: number | null) => {
    if (!income) return 'Not specified'
    if (income >= 10000000) {
      return `₹${(income / 10000000).toFixed(1)} Crore/yr`
    }
    return `₹${(income / 100000).toFixed(0)} Lakh/yr`
  }

  const handleSendInterest = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (interestSent) return

    setIsSending(true)
    try {
      if (onSendInterest) {
        await onSendInterest(profile.id)
      } else {
        // Mock server action call lag
        await new Promise((resolve) => setTimeout(resolve, 800))
        toast.success(`Interest sent to ${profile.first_name}!`)
      }
      setInterestSent(true)
    } catch {
      toast.error('Failed to send interest. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(profile.id)
    }
  }

  return (
    <Card 
      onClick={handleCardClick}
      className="group relative overflow-hidden rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col h-full"
    >
      {/* Profile Image & Badges Overlay */}
      <div className="relative aspect-[4/5] w-full bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
        <Image
          src={displayPhoto}
          alt={`${profile.first_name} ${profile.last_name}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={profile.is_premium}
          className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
            isPhotoBlurred ? 'blur-[8px]' : ''
          }`}
        />

        {/* Dynamic Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {/* Compatibility Score Overlay (Top Left) */}
        {compatibilityScore !== undefined && (
          <div className="absolute top-3 left-3 bg-rose-600/90 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 font-heading border border-rose-500/20">
            <Heart className="h-3 w-3 fill-white text-white animate-pulse" />
            <span>{compatibilityScore}% Match</span>
          </div>
        )}

        {/* Trust & Premium Badges Overlay (Top Right) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
          {profile.is_premium && (
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold text-[10px] px-2 py-0.5 border border-amber-400/30 flex items-center gap-1 shadow-sm uppercase tracking-wider">
              <Crown className="h-3 w-3 fill-yellow-100" />
              Premium
            </Badge>
          )}
          {profile.is_verified && (
            <Badge className="bg-emerald-500 text-white font-bold text-[10px] px-2 py-0.5 border border-emerald-400/20 flex items-center gap-1 shadow-sm uppercase tracking-wider">
              <ShieldCheck className="h-3 w-3 fill-emerald-100" />
              Verified
            </Badge>
          )}
        </div>

        {/* Blurred Photo Privacy Overlay */}
        {isPhotoBlurred && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 backdrop-blur-[12px] p-4 text-center">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-3 rounded-full mb-2">
              <Lock className="h-6 w-6 text-pink-200" />
            </div>
            <p className="text-white text-xs font-bold uppercase tracking-wider font-heading">Photo Protected</p>
            <p className="text-zinc-200 text-[10px] mt-1 max-w-[180px]">
              {profile.photo_privacy_tier === 'verified_members' 
                ? 'Only visible to KYC-verified members' 
                : 'Only visible to accepted connections'}
            </p>
          </div>
        )}

        {/* Core Info Overlay (Bottom of Photo) */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-baseline gap-2">
            <h4 className="text-xl font-bold font-heading truncate">
              {profile.first_name} {profile.last_name}
            </h4>
            <span className="text-lg font-medium opacity-90" suppressHydrationWarning>{age}</span>
          </div>
          
          <p className="text-xs text-pink-200/90 font-medium mt-0.5 flex items-center gap-1">
            <span>{profile.religion}</span>
            {profile.caste && (
              <>
                <span className="opacity-50">•</span>
                <span>{profile.caste}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Profile Info Details */}
      <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-1.5 min-w-0">
            <Briefcase className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate" title={profile.occupation || 'Not specified'}>
              {profile.occupation || 'Not specified'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <GraduationCap className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate" title={profile.education || 'Not specified'}>
              {profile.education || 'Not specified'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate" title={`${profile.city}, ${profile.state}`}>
              {profile.city}, {profile.state}
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <IndianRupee className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">
              {formatIncome(profile.annual_income)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              if (onViewDetails) onViewDetails(profile.id)
            }}
            className="flex-1 text-xs h-9 rounded-lg border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-[#E91E63] hover:border-[#E91E63]"
          >
            View Profile
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isSending || interestSent}
            onClick={handleSendInterest}
            className={`flex-1 text-xs h-9 rounded-lg font-semibold flex items-center justify-center gap-1 shadow-sm transition-all duration-300 ${
              interestSent
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                : 'bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white hover:scale-[1.02]'
            }`}
          >
            {interestSent ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5" />
                Sent
              </>
            ) : (
              <>
                <Heart className="h-3.5 w-3.5 fill-current" />
                Connect
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
