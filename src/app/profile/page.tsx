import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { 
  ProfileEditForm, 
  PartnerPreferencesForm, 
  ProfilePhotoUploader, 
  PrivacyControls 
} from '@/features/profiles'
import type { Profile } from '@/types/database'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Heart, User, EyeOff, Camera, ShieldCheck, AlertCircle, Crown } from 'lucide-react'
import { LandingHeader } from '@/features/landing/components/landing-header'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()

  // 1. Get current authenticated user session
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/login')
  }

  // 2. Fetch profile data from the database
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profileData) {
    // Redirect to login if database profile row is not found
    redirect('/login')
  }

  const profile = profileData as Profile

  // Safe cast for photo visibility status values
  const photoPrivacy = (profile.photo_privacy_tier || 'verified_members') as 'public' | 'verified_members' | 'connections'
  const lastNamePrivacy = profile.last_name_privacy ?? true

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF7FA] dark:bg-zinc-950 font-sans antialiased text-[#1A1A1A] dark:text-zinc-150 relative">
      <LandingHeader />
      
      <main className="flex-grow py-10 px-4">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
          
          {/* Profile Strength & Summary Header */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row gap-6 items-center justify-between relative overflow-hidden">
            {/* Subtle Pink Background Glow */}
            <div className="absolute -right-24 -bottom-24 w-64 h-64 bg-pink-100/40 dark:bg-pink-900/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-center gap-5 w-full md:w-auto">
              {/* Avatar Circle */}
              <div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-to-tr from-pink-500 to-rose-500 border-4 border-white dark:border-zinc-800 shadow-lg relative flex items-center justify-center shrink-0">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="Profile photo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-white text-3xl font-black">{profile.first_name?.[0]?.toUpperCase()}</span>
                )}
              </div>
              
              <div className="text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-white font-heading">
                    {profile.first_name} {profile.last_name}
                  </h2>
                  {profile.is_verified ? (
                    <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <ShieldCheck className="h-3 w-3 fill-emerald-50 dark:fill-transparent" />
                      Verified
                    </span>
                  ) : (
                    <span className="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <AlertCircle className="h-3 w-3" />
                      Awaiting Verification
                    </span>
                  )}
                  {profile.is_premium && (
                    <span className="bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Crown className="h-3 w-3 fill-current" />
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  Profile ID: <span className="text-zinc-650 dark:text-zinc-300 font-black">RJ-{profile.id.substring(0, 8).toUpperCase()}</span>
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Member since {new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>

            {/* Profile Strength Meter */}
            <div className="w-full md:w-72 space-y-2 border-t md:border-t-0 md:border-l border-zinc-150 dark:border-zinc-800 pt-5 md:pt-0 md:pl-6 shrink-0">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Profile Strength</span>
                <span className="text-sm font-black text-pink-600 font-heading" suppressHydrationWarning>{profile.profile_score || 0}%</span>
              </div>
              
              {/* Progress Bar Container */}
              <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-850 rounded-full overflow-hidden shadow-inner border border-zinc-200/10">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-1000"
                  style={{ width: `${profile.profile_score || 0}%` }}
                />
              </div>
              
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                {profile.profile_score && profile.profile_score >= 80 
                  ? '⭐ Excellent! Your profile is highly competitive and ready for matchmaking.'
                  : '💡 Boost your profile strength by completing your wizard form details.'}
              </p>
            </div>
          </div>

          {/* Tab System Wrapper */}
          <Tabs defaultValue="edit" className="w-full space-y-6">
            <TabsList className="flex flex-wrap gap-1.5 p-1 bg-zinc-200/50 dark:bg-zinc-800/40 rounded-2xl max-w-2xl border border-zinc-200/20 shadow-sm">
              <TabsTrigger value="edit" className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 py-2 px-4 rounded-xl data-[state=active]:bg-pink-600 data-[state=active]:text-white transition-all">
                <User className="h-4 w-4" />
                Edit Profile
              </TabsTrigger>
              <TabsTrigger value="photos" className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 py-2 px-4 rounded-xl data-[state=active]:bg-pink-600 data-[state=active]:text-white transition-all">
                <Camera className="h-4 w-4" />
                Photos Album
              </TabsTrigger>
              <TabsTrigger value="preferences" className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 py-2 px-4 rounded-xl data-[state=active]:bg-pink-600 data-[state=active]:text-white transition-all">
                <Heart className="h-4 w-4" />
                Partner Preferences
              </TabsTrigger>
              <TabsTrigger value="privacy" className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 py-2 px-4 rounded-xl data-[state=active]:bg-pink-600 data-[state=active]:text-white transition-all">
                <EyeOff className="h-4 w-4" />
                Privacy Settings
              </TabsTrigger>
            </TabsList>

            {/* Edit Profile Tab */}
            <TabsContent value="edit" className="outline-none">
              <ProfileEditForm profile={profile} />
            </TabsContent>

            {/* Photo Uploader Tab */}
            <TabsContent value="photos" className="outline-none">
              <ProfilePhotoUploader photos={profile.photos || []} avatarUrl={profile.avatar_url} />
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="outline-none">
              <PartnerPreferencesForm preferences={profile.partner_preferences} />
            </TabsContent>

            {/* Privacy Controls Tab */}
            <TabsContent value="privacy" className="outline-none">
              <PrivacyControls photoPrivacyTier={photoPrivacy} lastNamePrivacy={lastNamePrivacy} />
            </TabsContent>
          </Tabs>

        </div>
      </main>
    </div>
  )
}
