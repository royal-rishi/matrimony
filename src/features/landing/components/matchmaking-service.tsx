import { UserCheck, ShieldCheck, HeartHandshake, PhoneCall } from 'lucide-react'

const steps = [
  {
    icon: UserCheck,
    title: '1. Onboard & Verify',
    description: 'Register and complete your detailed partner preferences. Our Local Matchmaker verifies your identity proofs.',
  },
  {
    icon: ShieldCheck,
    title: '2. Get Assigned an Associate',
    description: 'We assign a dedicated Local Matchmaker (Associate) from your block/city to handle your matrimonial search.',
  },
  {
    icon: PhoneCall,
    title: '3. Handpicked Recommendations',
    description: 'Your Associate filters verified members, contacts candidate families, and coordinates shares securely.',
  },
  {
    icon: HeartHandshake,
    title: '4. Family Discussion & Marriage',
    description: 'We host meetings, facilitate secure family talks, coordinate pre-wedding milestones, and celebrate the wedding.',
  },
]

export function MatchmakingService() {
  return (
    <section id="matchmaking-service" className="py-20 bg-white dark:bg-zinc-950">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-pink-600">
            Personal Assisted Matchmaking
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Human Touch in a Digital World
          </p>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400">
            Don&apos;t want to browse profiles yourself? Let our certified Local Matchmakers handle the coordinate search, candidate vetting, and family introductions for you.
          </p>
        </div>

        {/* Process Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connector line on desktop */}
          <div className="hidden lg:block absolute top-10 left-16 right-16 h-0.5 bg-pink-100 dark:bg-zinc-800 -z-10" />

          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-4 group">
              {/* Step Circle */}
              <div className="h-20 w-20 rounded-full bg-white dark:bg-zinc-900 border-2 border-pink-100 dark:border-zinc-800 shadow-lg shadow-pink-100/10 flex items-center justify-center text-pink-600 group-hover:border-pink-600 group-hover:scale-105 transition-all duration-300">
                <step.icon className="h-9 w-9" />
              </div>
              
              <div className="space-y-2 max-w-xs">
                <h4 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white">
                  {step.title}
                </h4>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
