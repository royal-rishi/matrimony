/* eslint-disable @next/next/no-img-element */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  ShieldCheck, Crown, 
  MessageSquare, UserCheck, Settings, ArrowRight, Upload, Search, User, Lock,
  Phone, UserRound, Sparkles, Star
} from 'lucide-react'

// Helper function to calculate age
function getAge(dateString: string): number {
  if (!dateString) return 0
  const today = new Date()
  const birthDate = new Date(dateString)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

import { createClient } from '@/lib/supabase/server'
import { LandingHeader } from '@/features/landing/components/landing-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MatchmakerChatBtn } from '@/features/chat/components/matchmaker-chat-btn'

export const metadata = {
  title: 'My Matrimonial Dashboard | Rishtajodo',
  description: 'Manage profile status, track views, respond to match invites, and chat with accepted partners.',
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch user profile
  const { data: profile } = (await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()) as any

  if (!profile) {
    redirect('/onboarding')
  }

  const oppositeGender = profile.gender === 'male' ? 'female' : 'male'

  // 3. Fetch recommended matches (Opposite gender, matched by religion)
  const { data: recommendations } = (await supabase
    .from('profiles')
    .select('*')
    .eq('gender', oppositeGender)
    .eq('religion', profile.religion)
    .eq('is_deleted', false)
    .limit(3)) as any

  // 4. Fetch profile visitors
  const { data: visitorsRaw } = (await supabase
    .from('profile_visitors')
    .select(`
      visit_count,
      last_visited_at,
      visitor_id
    `)
    .eq('profile_id', user.id)
    .order('last_visited_at', { ascending: false })
    .limit(5)) as any

  // Hydrate visitor profiles
  let visitors: any[] = []
  if (visitorsRaw && visitorsRaw.length > 0) {
    const visitorIds = visitorsRaw.map((v: any) => v.visitor_id)
    const { data: visitorProfiles } = (await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url, city, state, is_verified, is_premium, occupation')
      .in('id', visitorIds)) as any

    visitors = visitorsRaw.map((v: any) => {
      const p = visitorProfiles?.find((vp: any) => vp.id === v.visitor_id)
      return {
        ...v,
        profile: p
      }
    }).filter((v: any) => v.profile)
  }

  // 5. Fetch interest counts
  // Received count
  const { count: receivedCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .or(`profile_id_1.eq.${user.id},profile_id_2.eq.${user.id}`)
    .neq('initiated_by_id', user.id)
    .eq('status', 'pending')

  // Sent count
  const { count: sentCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('initiated_by_id', user.id)
    .eq('status', 'pending')

  // Accepted count
  const { count: acceptedCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .or(`profile_id_1.eq.${user.id},profile_id_2.eq.${user.id}`)
    .eq('status', 'accepted')

  // 6. Fetch recent chat participants
  const { data: roomParticipants } = (await supabase
    .from('chat_room_participants')
    .select('room_id')
    .eq('profile_id', user.id)) as any

  const roomIds = roomParticipants?.map((p: any) => p.room_id) || []
  let activeChats: any[] = []

  if (roomIds.length > 0) {
    const { data: chatParticipants } = (await supabase
      .from('chat_room_participants')
      .select(`
        room_id,
        profile:profiles(id, first_name, last_name, avatar_url, city, state)
      `)
      .in('room_id', roomIds)
      .neq('profile_id', user.id)
      .limit(3)) as any

    activeChats = chatParticipants || []
  }

  const isPremium = profile.is_premium

  // 7. Query assigned local associate (if any)
  let assignedAssociate: any = null
  let assignedCase: any = null
  try {
    const { data: assignment } = await (supabase.from('user_assignments') as any)
      .select('id, local_associate_id, assigned_at')
      .eq('user_id', user.id)
      .is('unassigned_at', null)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (assignment?.local_associate_id) {
      const { data: assocProfile } = await (supabase.from('profiles') as any)
        .select('id, first_name, last_name, avatar_url, mobile_number, is_verified, city, state')
        .eq('id', assignment.local_associate_id)
        .maybeSingle()
      assignedAssociate = assocProfile || null

      // Fetch the case record for this user + associate
      const { data: caseRecord } = await (supabase.from('associate_cases') as any)
        .select('id, case_number, status, assigned_at')
        .eq('user_id', user.id)
        .eq('associate_id', assignment.local_associate_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      assignedCase = caseRecord || null
    }
  } catch (err) {
    // Non-blocking: silently fail if table doesn't exist yet
    console.warn('[Dashboard] user_assignments query failed:', err)
  }

  // 8. Fetch user notifications
  let notifications: any[] = []
  try {
    const { data: notifData } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    notifications = notifData || []
  } catch (err) {
    console.warn('[Dashboard] notifications query failed:', err)
  }

  // Check incomplete fields to list
  const incompleteSteps = []
  if (!profile.education) incompleteSteps.push({ label: 'Add Qualification Details', tab: 'edit' })
  if (!profile.occupation) incompleteSteps.push({ label: 'Add Profession details', tab: 'edit' })
  if (!profile.height || !profile.weight) incompleteSteps.push({ label: 'Add Height / Weight details', tab: 'edit' })
  if (profile.photos.length === 0) incompleteSteps.push({ label: 'Upload face photos to album', tab: 'photos' })

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF7FA] dark:bg-zinc-950 font-sans antialiased text-[#1A1A1A] dark:text-zinc-150 relative">
      <LandingHeader />
      
      <main className="flex-grow py-10 px-4">
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
          
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 shadow-md">
            <div className="flex items-center gap-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`${profile.first_name} ${profile.last_name}`}
                  className="w-14 h-14 rounded-full object-cover border-2 border-pink-500 shadow-sm"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center font-black text-lg border-2 border-pink-500 shadow-sm select-none">
                  {profile.first_name[0]}
                </div>
              )}
              <div>
                <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white font-heading flex items-center gap-2">
                  Namaste, {profile.first_name}!
                  {profile.is_verified && <ShieldCheck className="h-5 w-5 text-emerald-500 fill-emerald-50" />}
                </h1>
                <p className="text-xs text-zinc-500">
                  Welcome to your matrimonial command center. Here is your matching status today.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/profile">
                <Button variant="outline" className="border-zinc-200 text-xs font-semibold h-10 px-4 rounded-lg flex items-center gap-1 cursor-pointer">
                  <User className="h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
              <Link href="/search">
                <Button className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold h-10 px-4 rounded-lg flex items-center gap-1 shadow-sm cursor-pointer">
                  <Search className="h-4 w-4" />
                  Find Matches
                </Button>
              </Link>
            </div>
          </div>

          {/* Core Dashboard Content Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Left Column: Profile Completion, Status, Quick Actions */}
            <div className="md:col-span-1 space-y-6">
              
              {/* Profile Completion Widget */}
              <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider">Profile Strength</CardTitle>
                  <CardDescription className="text-[11px]">Keep it above 85% for better visibility score</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-zinc-650">
                      <span>Completion Score</span>
                      <span className="text-pink-600">{profile.profile_score || 0}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-600 to-rose-500 transition-all rounded-full" 
                        style={{ width: `${profile.profile_score || 0}%` }}
                      />
                    </div>
                  </div>

                  {incompleteSteps.length > 0 ? (
                    <div className="space-y-2 pt-2 border-t border-zinc-100">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">Pending Updates</p>
                      {incompleteSteps.map((step, idx) => (
                        <Link key={idx} href={`/profile`} className="flex items-center justify-between p-2 rounded-lg bg-pink-50/30 hover:bg-pink-50/60 border border-pink-100/30 text-xs text-pink-700 font-semibold transition-all">
                          <span>{step.label}</span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100 flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4" />
                      All details up to date! Visible to search.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Membership Status Widget */}
              <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider">Membership Level</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${isPremium ? 'bg-amber-50 text-amber-600' : 'bg-zinc-100 text-zinc-500'}`}>
                        <Crown className="h-5 w-5 fill-current" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-800 capitalize">{profile.subscription_tier} Account</h4>
                        <p className="text-[10px] text-zinc-400">{isPremium ? 'Gold Premium active' : 'Limited features'}</p>
                      </div>
                    </div>
                    {isPremium ? (
                      <Badge className="bg-emerald-500 text-white font-bold text-[9px] uppercase">Elite Active</Badge>
                    ) : (
                      <Link href="/membership">
                        <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white text-[10px] font-bold h-8 px-3 rounded-lg uppercase">Upgrade</Button>
                      </Link>
                    )}
                  </div>

                  <div className="text-[11px] text-zinc-500 pt-2 border-t border-zinc-100 space-y-1">
                    <p>• {isPremium ? 'Unlimited direct contact numbers unlocked' : 'View contact details locked'}</p>
                    <p>• {isPremium ? 'Unrestricted Chat room access active' : 'Chat unlocked only after interest accept'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Panel */}
              <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black text-zinc-400 uppercase tracking-wider">Quick Controls</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-xs">
                  <Link href="/profile">
                    <Button variant="outline" className="w-full text-[10px] font-bold border-zinc-200 h-9 rounded-lg flex items-center justify-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      Edit Bio
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="outline" className="w-full text-[10px] font-bold border-zinc-200 h-9 rounded-lg flex items-center justify-center gap-1">
                      <Upload className="h-3.5 w-3.5" />
                      Add Photos
                    </Button>
                  </Link>
                  <Link href="/settings">
                    <Button variant="outline" className="w-full text-[10px] font-bold border-zinc-200 h-9 rounded-lg flex items-center justify-center gap-1">
                      <Settings className="h-3.5 w-3.5" />
                      Privacy
                    </Button>
                  </Link>
                  <Link href="/support">
                    <Button variant="outline" className="w-full text-[10px] font-bold border-zinc-200 h-9 rounded-lg flex items-center justify-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Help Desk
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Right Columns: Recommended, Visitors, Interests, Messages */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Interests invitation status widget */}
              <div className="grid grid-cols-3 gap-4">
                <Link href="/interests?tab=received" className="bg-white border border-zinc-200/60 rounded-xl p-4 shadow-sm text-center hover:shadow-md transition-all">
                  <p className="text-2xl font-black text-pink-600">{receivedCount || 0}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mt-0.5">Invites Received</p>
                </Link>
                <Link href="/interests?tab=sent" className="bg-white border border-zinc-200/60 rounded-xl p-4 shadow-sm text-center hover:shadow-md transition-all">
                  <p className="text-2xl font-black text-zinc-700">{sentCount || 0}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mt-0.5">Interests Sent</p>
                </Link>
                <Link href="/interests?tab=accepted" className="bg-white border border-zinc-200/60 rounded-xl p-4 shadow-sm text-center hover:shadow-md transition-all">
                  <p className="text-2xl font-black text-emerald-600">{acceptedCount || 0}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mt-0.5">Connections</p>
                </Link>
              </div>

              {/* ────────────────────────────────────────────────────────── */}
              {/* Personal Matchmaker Widget (Assigned / Hire CTA)          */}
              {/* ────────────────────────────────────────────────────────── */}

              {assignedAssociate ? (
                /* === Assigned Matchmaker Card === */
                <Card className="border-rose-200 dark:border-rose-800 shadow-md bg-gradient-to-br from-rose-50 to-white dark:from-zinc-900 dark:to-zinc-900 overflow-hidden relative">
                  {/* Decorative accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-400" />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
                          <UserRound className="h-4 w-4" />
                          Your Personal Matchmaker
                        </CardTitle>
                        <CardDescription className="text-[11px] mt-0.5">
                          Dedicated matchmaker is actively finding the perfect match for you
                        </CardDescription>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] font-bold uppercase">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-zinc-800 border border-rose-100 dark:border-zinc-700 shadow-sm">
                      {/* Matchmaker avatar + info */}
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-14 rounded-full overflow-hidden bg-rose-100 border-2 border-rose-300 shrink-0">
                          {assignedAssociate.avatar_url ? (
                            <img
                              src={assignedAssociate.avatar_url}
                              alt={assignedAssociate.first_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-rose-100 text-rose-600">
                              <UserRound className="h-7 w-7" />
                            </div>
                          )}
                          {assignedAssociate.is_verified && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white">
                              <ShieldCheck className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-zinc-800 dark:text-white">
                            {assignedAssociate.first_name} {assignedAssociate.last_name}
                          </h4>
                          <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-emerald-500" />
                            Verified Matchmaker
                          </p>
                          {(assignedAssociate.city || assignedAssociate.state) && (
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              📍 {[assignedAssociate.city, assignedAssociate.state].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Case info + actions */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {assignedCase && (
                          <div className="text-right">
                            <p className="text-[9px] text-zinc-400 font-semibold uppercase">Case</p>
                            <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-200">
                              {assignedCase.case_number}
                            </p>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[9px] font-bold text-rose-600 uppercase">
                              {(assignedCase.status as string).replace(/_/g, ' ')}
                            </span>
                          </div>
                        )}
                        {assignedAssociate.mobile_number && (
                          <a
                            href={`tel:${assignedAssociate.mobile_number}`}
                            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-rose-600 transition-colors"
                          >
                            <Phone className="h-3 w-3" />
                            {assignedAssociate.mobile_number}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Chat button */}
                    <div className="mt-3">
                      <MatchmakerChatBtn
                        associateId={assignedAssociate.id}
                        associateName={assignedAssociate.first_name}
                        className="w-full h-10 text-xs font-bold rounded-lg"
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* === Hire Matchmaker CTA Banner === */
                <div className="relative rounded-2xl overflow-hidden border border-rose-200 shadow-md bg-gradient-to-br from-rose-600 via-pink-600 to-rose-500 p-6 text-white">
                  {/* Decorative sparkle dots */}
                  <div className="absolute top-3 right-4 opacity-20">
                    <Sparkles className="h-16 w-16" />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-200">Exclusive Feature</p>
                      <h3 className="text-lg font-black leading-tight">
                        Struggling to find<br />the right match? 💍
                      </h3>
                      <p className="text-xs text-rose-100 leading-relaxed max-w-xs">
                        Hire a local Personal Matchmaker who will personally screen, shortlist, and introduce the most compatible profiles for you.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { icon: <UserRound className="h-4 w-4" />, label: 'Dedicated Matchmaker' },
                        { icon: <ShieldCheck className="h-4 w-4" />, label: 'Verified Profiles Only' },
                        { icon: <Star className="h-4 w-4" />, label: 'Direct Introductions' },
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 bg-white/10 rounded-xl p-2 text-center">
                          {item.icon}
                          <span className="text-[9px] font-bold leading-tight">{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <Link href="/membership">
                      <Button className="w-full h-10 bg-white text-rose-700 hover:bg-rose-50 font-black text-xs rounded-xl shadow-sm mt-1">
                        Hire Matchmaker Assist — ₹4,999
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Recommended Matches Widget */}

              <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md bg-white">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider">Recommended Matches</CardTitle>
                    <CardDescription className="text-[11px]">Curated based on your partner preferences</CardDescription>
                  </div>
                  <Link href="/matches?category=recommended">
                    <Button variant="ghost" size="sm" className="text-xs text-pink-600 hover:text-pink-700 font-bold p-0 flex items-center gap-0.5">
                      See All
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-3 gap-4">
                  {recommendations && recommendations.length > 0 ? (
                    recommendations.map((rec: any) => {
                      const age = getAge(rec.date_of_birth)
                      const recPhoto = rec.photos?.[0] || rec.avatar_url || '/logo/blurred-photo-placeholder.jpg'
                      return (
                        <Link key={rec.id} href={`/matches`} className="group relative rounded-xl overflow-hidden aspect-[4/5] border bg-zinc-50 hover:shadow-md transition-all">
                          <img src={recPhoto} alt={rec.first_name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                          <div className="absolute bottom-2.5 left-2.5 text-white">
                            <p className="text-xs font-bold">{rec.first_name}, {age}</p>
                            <p className="text-[9px] opacity-75">{rec.religion} • {rec.city}</p>
                          </div>
                        </Link>
                      )
                    })
                  ) : (
                    <div className="col-span-3 text-center py-6 text-xs text-zinc-400 font-semibold">
                      Fill out partner preferences to see matches!
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Profile Visitors Log Widget */}
              <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md bg-white">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider">Profile Visitors</CardTitle>
                    <CardDescription className="text-[11px]">Members who recently viewed your profile</CardDescription>
                  </div>
                  {!isPremium && (
                    <Badge className="bg-amber-100 text-amber-700 border border-amber-200 font-bold text-[9px] uppercase flex items-center gap-0.5">
                      <Lock className="h-2.5 w-2.5" />
                      Premium Feature
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {visitors && visitors.length > 0 ? (
                    visitors.map((v, idx) => {
                      const visitorProfile = v.profile
                      const isBlurred = !isPremium
                      const visitorName = isBlurred ? 'Premium Member' : `${visitorProfile.first_name} ${visitorProfile.last_name}`
                      const visitorPhoto = isBlurred ? '/logo/blurred-photo-placeholder.jpg' : (visitorProfile.avatar_url || '/logo/blurred-photo-placeholder.jpg')
                      
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-zinc-250/20 bg-zinc-50/50 hover:bg-zinc-50 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-zinc-100 border relative">
                              <img src={visitorPhoto} alt="Visitor avatar" className={`h-full w-full object-cover ${isBlurred ? 'blur-[4px]' : ''}`} />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                                {visitorName}
                                {!isBlurred && visitorProfile.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
                              </h4>
                              <p className="text-[9px] text-zinc-400">
                                {isBlurred ? 'Unlock with Gold plan' : `${visitorProfile.occupation || 'Business'} • ${visitorProfile.city}, ${visitorProfile.state}`}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right text-[10px] text-zinc-400 space-y-0.5">
                            <p className="font-semibold">{v.visit_count} views</p>
                            <p className="text-[9px]">{new Date(v.last_visited_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-6 text-xs text-zinc-400 font-semibold border border-dashed rounded-xl">
                      No visits recorded yet. Keep your profile active to gain visibility!
                    </div>
                  )}

                  {!isPremium && (
                    <div className="pt-2 text-center">
                      <Link href="/membership">
                        <Button variant="link" className="text-xs text-pink-600 font-bold p-0">
                          Upgrade membership to view visitor details &rarr;
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Active Chats Widget */}
              <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md bg-white">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider">Active Conversations</CardTitle>
                  </div>
                  <Link href="/chat">
                    <Button variant="ghost" size="sm" className="text-xs text-pink-600 hover:text-pink-700 font-bold p-0 flex items-center gap-0.5">
                      Open Center
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeChats && activeChats.length > 0 ? (
                    activeChats.map((chat, idx) => (
                      <Link key={idx} href="/chat" className="flex items-center justify-between p-3 rounded-xl border border-zinc-250/20 bg-zinc-50/50 hover:bg-zinc-50 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full overflow-hidden bg-zinc-100 border">
                            <img src={chat.profile.avatar_url || '/logo/blurred-photo-placeholder.jpg'} alt={chat.profile.first_name} className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-zinc-800">{chat.profile.first_name} {chat.profile.last_name}</h4>
                            <p className="text-[9px] text-zinc-400">{chat.profile.city}, {chat.profile.state}</p>
                          </div>
                        </div>
                        <Badge className="bg-pink-100 text-pink-700 border border-pink-200 text-[9px] font-bold">Active Chat</Badge>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-zinc-400 font-semibold border border-dashed rounded-xl">
                      Start connecting! Accepted interests will unlock secure realtime chat rooms here.
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
