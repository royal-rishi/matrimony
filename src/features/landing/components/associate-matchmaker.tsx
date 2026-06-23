import { UserCheck, Search, Users, HeartHandshake, PhoneCall } from 'lucide-react'
import Link from 'next/link'

const features = [
  {
    icon: UserCheck,
    title: 'Profile Assistance',
    description: 'Our certified Local Associate meets you, helps curate your biodata, and verifies all credentials personally.',
  },
  {
    icon: Search,
    title: 'Partner Search',
    description: 'Instead of searching through thousands of profiles, your Associate handpicks and recommends vetted matches.',
  },
  {
    icon: Users,
    title: 'Family Coordination',
    description: 'Associates act as trusted mediators, initiating calls and hosting initial family introduction meetings.',
  },
  {
    icon: HeartHandshake,
    title: 'Marriage Support',
    description: 'We assist with pre-wedding logistics, check local references, and guide you all the way to the wedding.',
  },
]

export function AssociateMatchmaker() {
  return (
    <section className="py-20 bg-pink-50/20 dark:bg-zinc-950/40 border-y border-pink-100/60 dark:border-zinc-800/60">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: USP Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-pink-600">
                Personal Assisted Matchmaking
              </h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-[#3c0f20] dark:text-white font-serif leading-tight">
                Need Personal Help? <br />
                Get a Dedicated Local Associate
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl">
                RishtaJoro is India&apos;s only matrimonial network combining an AI search platform with verified local human matchmakers (Associates) stationed in your community.
              </p>
            </div>

            {/* Checklist Grid */}
            <div className="grid sm:grid-cols-2 gap-6 pt-2">
              {features.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-pink-50 dark:bg-pink-950/25 border border-pink-100 dark:border-zinc-800 flex items-center justify-center text-pink-650 shrink-0">
                    <item.icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-[13px] text-zinc-900 dark:text-white leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 text-center sm:text-left">
              <Link
                href="/register?assisted=true"
                className="inline-flex h-11 px-8 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow-md shadow-pink-200/50 dark:shadow-none hover:shadow-lg transition-all duration-300 items-center justify-center gap-2"
              >
                <PhoneCall className="h-4 w-4" />
                Get Personal Matchmaker
              </Link>
            </div>
          </div>

          {/* Right Column: Premium Associate Badge Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              {/* Background circular glow */}
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-pink-100/40 blur-2xl" />

              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-pink-50 dark:bg-pink-950/30 border border-pink-100 flex items-center justify-center text-pink-600 mx-auto">
                  <UserCheck className="h-8 w-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-lg text-[#3c0f20] dark:text-white font-serif">
                    Local Associate Network
                  </h4>
                  <p className="text-xs text-zinc-400 font-semibold uppercase">
                    Trusted Mediation
                  </p>
                </div>

                <div className="bg-pink-50/50 dark:bg-zinc-950/40 rounded-xl p-4 border border-pink-100/40 text-left space-y-2 text-xs">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Why choose Assisted Matchmaking?
                  </p>
                  <ul className="space-y-1.5 text-zinc-500 dark:text-zinc-400">
                    <li className="flex items-center gap-1.5">• 100% manual family verification</li>
                    <li className="flex items-center gap-1.5">• Address & ID checked locally</li>
                    <li className="flex items-center gap-1.5">• High-privacy matchmaking</li>
                    <li className="flex items-center gap-1.5">• Direct offline coordinator</li>
                  </ul>
                </div>

                <div className="pt-2 text-[10px] text-zinc-400 font-semibold uppercase">
                  ⭐ 4.8 / 5 Rated by over 10K Families
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
