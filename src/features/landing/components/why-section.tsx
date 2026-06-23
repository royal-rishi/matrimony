import { Search, Star, MessageSquare, Gem, Heart } from 'lucide-react'

const features = [
  {
    icon: Search,
    title: 'Wide Search',
    description: 'Find matches from your community and beyond.',
  },
  {
    icon: Star,
    title: 'Smart Matches',
    description: 'AI powered matching for better compatibility.',
  },
  {
    icon: MessageSquare,
    title: 'Easy Communication',
    description: 'Connect easily with interested matches.',
  },
  {
    icon: Gem,
    title: 'Premium Benefits',
    description: 'Unlock premium features for a better experience.',
  },
  {
    icon: Heart,
    title: 'Success Stories',
    description: 'Many successful relationships and marriages.',
  },
]

export function WhySection() {
  return (
    <section id="why-us" className="py-16 bg-white dark:bg-zinc-950">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3c0f20] dark:text-white font-serif">
            Why Choose Rishtajodo?
          </h2>
          <div className="flex items-center justify-center gap-1 text-pink-650">
            <div className="h-[1px] w-12 bg-pink-205" />
            <Heart className="h-3.5 w-3.5 fill-pink-600 text-pink-600" />
            <div className="h-[1px] w-12 bg-pink-205" />
          </div>
        </div>

        {/* Features Grid - 5 columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group flex flex-col items-center p-4 space-y-3 rounded-2xl hover:bg-pink-50/20 transition-all duration-300 col-span-1"
            >
              {/* Pink Icon */}
              <div className="h-12 w-12 rounded-full border border-pink-100 bg-pink-50 dark:bg-pink-950/20 flex items-center justify-center text-pink-600 dark:text-pink-400 group-hover:scale-105 transition-transform duration-300">
                <feature.icon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-[#3c0f20] dark:text-white text-[13px] tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-snug">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
