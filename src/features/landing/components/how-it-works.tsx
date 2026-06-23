import { UserCheck, Compass, Shield, Heart } from 'lucide-react'

const steps = [
  {
    badge: 'Instant Check',
    title: 'Create Profile & Verification',
    description: 'Register in under 60 seconds. Our expert team inspects manual photo credentials, emails, and credentials to assign instant verified badges.',
    icon: UserCheck,
    stepNum: '01'
  },
  {
    badge: '98% Match Rate',
    title: 'Astro & Custom Filters',
    description: 'Enter criteria such as Gothras, mother tongues, education backgrounds, and Kundali specs. Enjoy custom astronomical matching systems!',
    icon: Compass,
    stepNum: '02'
  },
  {
    badge: 'Data Shield Active',
    title: 'Secure Chat & Interact',
    description: 'Initiate completely protected conversations. Exchange values and expressions directly in our secure app interface without revealing private details.',
    icon: Shield,
    stepNum: '03'
  },
  {
    badge: 'Sacred Bond',
    title: 'Respected Family Meets',
    description: 'Organize physical and call interactions alongside respected family managers. Culminate in a beautiful alignment and lifelong matrimony.',
    icon: Heart,
    stepNum: '04'
  }
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white dark:bg-zinc-950 border-b border-pink-100/60 dark:border-zinc-900/60">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-pink-650 dark:text-pink-400">
            How Rishta Jodo Works
          </span>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#3c0f20] dark:text-white font-serif">
            Our Signature Matchmaking Lifecycle
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Our signature 4-step matchmaking lifecycle ensures maximum security, genuine compatibility, and respected family introductions.
          </p>
        </div>

        {/* Timeline Layout */}
        <div className="relative">
          {/* Connector line for desktop */}
          <div className="absolute top-1/2 left-4 md:left-1/2 -translate-x-1/2 w-0.5 h-full md:h-0.5 bg-gradient-to-b md:bg-gradient-to-r from-pink-200 via-rose-200 to-pink-200 dark:from-zinc-800 dark:to-zinc-800 -translate-y-1/2 md:translate-y-0 hidden md:block" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 relative z-10">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center text-center group bg-pink-50/20 dark:bg-zinc-900/30 border border-pink-100/30 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative"
              >
                {/* Step number watermark */}
                <div className="absolute top-4 right-4 text-3xl font-extrabold text-pink-100 dark:text-zinc-800 font-serif select-none pointer-events-none">
                  {step.stepNum}
                </div>

                {/* Step Circle Counter */}
                <div className="relative flex items-center justify-center mb-5">
                  <div className="h-16 w-16 rounded-full bg-white dark:bg-zinc-900 border-2 border-pink-100 dark:border-zinc-800 shadow-md flex items-center justify-center text-pink-650 group-hover:border-pink-600 group-hover:scale-105 transition-all duration-300">
                    <step.icon className="h-7 w-7" />
                  </div>
                </div>
                
                <div className="space-y-2.5 flex-grow flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-base text-zinc-900 dark:text-white tracking-tight">
                      {step.title}
                    </h4>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed mt-2">
                      {step.description}
                    </p>
                  </div>

                  {/* Badge */}
                  <div className="pt-4">
                    <span className="inline-block px-3 py-1 bg-pink-50 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900/40 text-pink-600 dark:text-pink-400 font-extrabold text-[10px] tracking-wider uppercase rounded-full shadow-sm">
                      {step.badge}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
