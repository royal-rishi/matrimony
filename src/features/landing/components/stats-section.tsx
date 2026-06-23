import { Users, Sparkles, Award, Heart } from 'lucide-react'

const stats = [
  {
    icon: Users,
    value: '25,000+',
    label: 'Verified Members',
    description: 'Government ID & address checked candidates.',
  },
  {
    icon: Heart,
    value: '4,800+',
    label: 'Happy Marriages',
    description: 'Couples united across India.',
  },
  {
    icon: Sparkles,
    value: '94%',
    label: 'AI Success Rate',
    description: 'High value-compatibility match score.',
  },
  {
    icon: Award,
    value: '4.8★',
    label: 'Associate Rating',
    description: 'Top-tier rating for local assistance.',
  },
]

export function StatsSection() {
  return (
    <section className="py-16 bg-gradient-to-r from-pink-600 to-rose-500 text-white relative overflow-hidden">
      {/* Background glow overlay */}
      <div className="absolute inset-0 bg-black/5 -z-10" />

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mb-1">
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {stat.value}
              </p>
              <div className="space-y-1">
                <p className="font-bold text-sm sm:text-base">{stat.label}</p>
                <p className="text-white/80 text-[10px] sm:text-xs leading-normal max-w-[200px] mx-auto">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
