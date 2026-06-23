/* eslint-disable @next/next/no-img-element */
import { createClient } from '@/lib/supabase/server'
import { ShieldCheck, Lock, MapPin, Briefcase, GraduationCap, Sparkles } from 'lucide-react'
import Link from 'next/link'

export async function FeaturedGrooms() {
  let grooms: any[] = []

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('gender', 'male')
      .eq('is_featured', true)
      .eq('is_verified', true)
      .order('created_at', { ascending: false })
      .limit(3)

    if (error) throw error
    grooms = data || []
  } catch (e: any) {
    console.error('Error fetching featured grooms:', e)
  }

  // Fallback static data if database is empty or fails
  const fallbackGrooms = [
    {
      id: 'mock-groom-1',
      first_name: 'Vikram',
      last_name: 'Malhotra',
      date_of_birth: '1996-03-12', // ~30 yrs
      education: 'MBA - IIM',
      occupation: 'Investment Banker',
      city: 'Mumbai',
      state: 'Maharashtra',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'mock-groom-2',
      first_name: 'Adil',
      last_name: 'Siddiqui',
      date_of_birth: '1997-11-25', // ~28 yrs
      education: 'B.Tech - IIT',
      occupation: 'Tech Lead',
      city: 'Hyderabad',
      state: 'Telangana',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'mock-groom-3',
      first_name: 'Rohit',
      last_name: 'Mehta',
      date_of_birth: '1995-07-02', // ~31 yrs
      education: 'M.A. Public Policy',
      occupation: 'IAS Officer',
      city: 'Delhi',
      state: 'Delhi',
      avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    }
  ]

  const displayGrooms = grooms.length > 0 ? grooms : fallbackGrooms

  // Helper to calculate age
  const calculateAge = (dobString: string) => {
    try {
      const birthDate = new Date(dobString)
      const difference = Date.now() - birthDate.getTime()
      const ageDate = new Date(difference)
      return Math.abs(ageDate.getUTCFullYear() - 1970)
    } catch {
      return 29
    }
  }

  return (
    <section id="featured-grooms" className="py-20 bg-gradient-to-b from-[#FFF0F5] to-[#FFF7FA] dark:from-pink-950/10 dark:to-zinc-950 border-b border-pink-100/60 dark:border-zinc-900/60">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-50 dark:bg-pink-950/40 border border-pink-100/50 dark:border-pink-900/40 text-[10px] font-bold tracking-widest text-pink-650 dark:text-pink-400 uppercase">
            <Sparkles className="h-3 w-3 fill-pink-500/10" />
            Distinguished Matches
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#3c0f20] dark:text-white font-serif">
            Featured Grooms
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Highly qualified professionals, tech advocates, doctors, and corporate leaders from respectable families.
          </p>
        </div>

        {/* Grooms Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayGrooms.map((groom) => {
            const age = calculateAge(groom.date_of_birth)
            const photoUrl = groom.avatar_url || (groom.photos && groom.photos[0]) || '/images/default-avatar.png'
            
            return (
              <div
                key={groom.id}
                className="group relative overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-pink-100/40 dark:border-zinc-800/60 p-4 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Photo & Badge Overlay */}
                <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-pink-50/50 dark:bg-zinc-950/60 border border-pink-50 dark:border-zinc-800">
                  <img
                    src={photoUrl}
                    alt={`${groom.first_name}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Verified Badge */}
                  <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider py-1 px-2.5 rounded-full flex items-center gap-1 shadow-md">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified
                  </div>
                  {/* Privacy Badge */}
                  <div className="absolute top-3 right-3 bg-zinc-900/70 backdrop-blur-md text-white text-[10px] font-bold py-1 px-2.5 rounded-full flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Privacy Active
                  </div>
                  {/* Premium Badge */}
                  <div className="absolute bottom-3 left-3 bg-gradient-to-r from-amber-500 to-pink-600 text-white text-[9px] font-bold uppercase tracking-widest py-0.5 px-2 rounded-md">
                    Elite Tier
                  </div>
                </div>

                {/* Details Section */}
                <div className="mt-4 space-y-3.5 flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-extrabold text-[#3c0f20] dark:text-white text-lg tracking-tight">
                        {groom.first_name} <span className="text-zinc-400 dark:text-zinc-500 font-medium">({age})</span>
                      </h3>
                      <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 text-xs mt-1 font-semibold">
                        <MapPin className="h-3.5 w-3.5 text-pink-600" />
                        <span>{groom.city}, {groom.state}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-3 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-650 dark:text-zinc-350">
                      <GraduationCap className="h-4 w-4 shrink-0 text-pink-600" />
                      <span className="font-medium truncate" title={groom.education}>{groom.education || 'Graduate'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-650 dark:text-zinc-350">
                      <Briefcase className="h-3.5 w-3.5 shrink-0 text-pink-600" />
                      <span className="font-medium truncate" title={groom.occupation}>{groom.occupation || 'Professional'}</span>
                    </div>
                  </div>
                </div>

                {/* CTA Action */}
                <div className="mt-5 border-t border-pink-50 dark:border-zinc-800/50 pt-4">
                  <Link
                    href={`/profile/${groom.id}`}
                    className="w-full h-10 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-1.5"
                  >
                    Connect & Chat
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
