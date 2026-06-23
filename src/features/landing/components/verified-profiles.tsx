import Link from 'next/link'
import { Shield, Heart, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const mockProfiles = [
  {
    name: 'Ananya Iyer',
    age: 26,
    gender: 'female',
    profession: 'Software Architect',
    education: 'M.Tech, BITS Pilani',
    city: 'Bangalore',
    state: 'Karnataka',
    religion: 'Hindu',
    motherTongue: 'Tamil',
    compatibility: 96,
    isPremium: true,
  },
  {
    name: 'Vikram Malhotra',
    age: 29,
    gender: 'male',
    profession: 'Product Manager',
    education: 'MBA, ISB Hyderabad',
    city: 'New Delhi',
    state: 'Delhi',
    religion: 'Hindu',
    motherTongue: 'Hindi',
    compatibility: 92,
    isPremium: true,
  },
  {
    name: 'Meera Deshmukh',
    age: 25,
    gender: 'female',
    profession: 'Clinical Cardiologist',
    education: 'MD, KEM Hospital Mumbai',
    city: 'Pune',
    state: 'Maharashtra',
    religion: 'Hindu',
    motherTongue: 'Marathi',
    compatibility: 89,
    isPremium: false,
  },
  {
    name: 'Adil Siddiqui',
    age: 28,
    gender: 'male',
    profession: 'Lead Data Scientist',
    education: 'MS, Georgia Tech',
    city: 'Hyderabad',
    state: 'Telangana',
    religion: 'Muslim',
    motherTongue: 'Urdu',
    compatibility: 91,
    isPremium: true,
  },
]

export function VerifiedProfiles() {
  return (
    <section id="verified-profiles" className="py-20 bg-white dark:bg-zinc-950">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="space-y-3 max-w-2xl text-center md:text-left">
            <h2 className="text-xs font-bold uppercase tracking-wider text-pink-600">
              Verified Members
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Discover Truly Verified Partners
            </p>
            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400">
              Every profile listed undergoes Government ID verification and address check before they can connect. No spam, no bot profiles.
            </p>
          </div>
          <div className="flex justify-center shrink-0">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                "border-zinc-200 text-rose-600 hover:bg-rose-50/50 dark:border-zinc-800 rounded-lg group flex items-center justify-center gap-1.5 font-semibold h-10 px-4"
              )}
            >
              View All Profiles
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Profiles Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {mockProfiles.map((profile, index) => (
            <Card
              key={index}
              className="overflow-hidden border-zinc-200/50 shadow-md shadow-zinc-100/10 hover:shadow-xl hover:shadow-pink-100/10 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 group"
            >
              {/* Profile Avatar Area */}
              <div className="h-56 bg-gradient-to-br from-pink-100 to-rose-200 dark:from-pink-950 dark:to-rose-900 relative overflow-hidden flex items-center justify-center">
                <Heart className="h-14 w-14 text-pink-300 dark:text-pink-800 fill-pink-300/10 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent z-10" />

                {/* Floating Badges */}
                <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
                  <Badge className="bg-emerald-600 text-white font-medium hover:bg-emerald-600 text-[10px] rounded-full px-2 py-0.5 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Verified
                  </Badge>
                  {profile.isPremium && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-500 text-zinc-900 font-bold text-[10px] rounded-full px-2 py-0.5">
                      ★ Premium
                    </Badge>
                  )}
                </div>

                <div className="absolute top-3 right-3 z-20">
                  <Badge className="bg-white/90 dark:bg-zinc-900/90 text-rose-600 font-bold hover:bg-white/90 text-[10px] rounded-full px-2 py-1 shadow-sm flex items-center gap-1 border border-pink-100/20">
                    <Sparkles className="h-3.5 w-3.5 fill-rose-500/20" />
                    {profile.compatibility}% Match
                  </Badge>
                </div>

                {/* Info Overlay */}
                <div className="absolute bottom-4 left-4 z-20 text-white space-y-1">
                  <p className="font-extrabold text-lg flex items-center gap-1.5 leading-none">
                    {profile.name}
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 fill-emerald-400 shrink-0" />
                  </p>
                  <p className="text-xs opacity-90 font-medium">
                    {profile.age} Yrs • {profile.city}, {profile.state}
                  </p>
                </div>
              </div>

              {/* Profile Details */}
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <div>
                    <p className="text-zinc-400 font-medium">Profession</p>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{profile.profession}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 font-medium">Education</p>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{profile.education}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 font-medium">Religion / Caste</p>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">{profile.religion}</p>
                  </div>
                  <div>
                    <p className="text-zinc-400 font-medium">Mother Tongue</p>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">{profile.motherTongue}</p>
                  </div>
                </div>
              </CardContent>

              {/* Profile Action Buttons */}
              <CardFooter className="p-4 pt-0 flex gap-2 border-t border-zinc-100 dark:border-zinc-800/80 mt-2">
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    "flex-grow flex-1 h-9 border-zinc-200 hover:bg-rose-50 hover:text-rose-600 text-zinc-700 dark:text-zinc-300 dark:border-zinc-800 text-xs font-semibold rounded-lg flex items-center justify-center"
                  )}
                >
                  View Full Profile
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ variant: 'default' }),
                    "flex-grow flex-1 h-9 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white hover:text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center"
                  )}
                >
                  Send Interest
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
