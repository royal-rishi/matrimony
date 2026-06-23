import { Quote, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const reviews = [
  {
    name: 'Suresh Chandra',
    role: 'Parent (Father)',
    quote: 'As a father, finding a safe partner for my daughter was my top priority. RishtaJoro assigned us a local associate in Lucknow who verified all families. We found a perfect match safely.',
    stars: 5,
    initials: 'SC',
  },
  {
    name: 'Priyanka Sen',
    role: 'Premium User',
    quote: 'The value compatibility scoring is incredible. I was matched with Rohit and we scored 91% on compatibility. Everything the AI highlighted about our shared views turned out to be spot on!',
    stars: 5,
    initials: 'PS',
  },
  {
    name: 'Harsh Vardhan',
    role: 'Marriage Seeker',
    quote: 'The hybrid model is what makes RishtaJoro special. The app helped me search profiles easily, and the local matchmaker helped with the family introductions and visiting logistics.',
    stars: 5,
    initials: 'HV',
  },
]

export function Testimonials() {
  return (
    <section className="py-20 bg-pink-50/20 dark:bg-zinc-950/40 border-y border-pink-100/60 dark:border-zinc-800/60">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-pink-600">
            Reviews
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#3c0f20] dark:text-white font-serif">
            What Families & Seekers Say
          </h3>
          <div className="flex items-center justify-center gap-1.5 text-amber-500 pt-1 text-sm font-bold">
            <span className="text-zinc-700 dark:text-zinc-300">Rated 4.8 / 5</span>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <span className="text-zinc-400 font-normal">(10,000+ Families)</span>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((review, idx) => (
            <Card
              key={idx}
              className="border-zinc-200/50 shadow-md hover:shadow-xl dark:border-zinc-800/50 bg-white dark:bg-zinc-900/60 backdrop-blur-md transition-all duration-300 flex flex-col justify-between"
            >
              <CardContent className="p-6 space-y-6">
                {/* Header: Avatar, Name, Rating */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-pink-100 bg-pink-50 text-pink-600 text-xs font-bold shrink-0">
                      <AvatarFallback>{review.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">
                        {review.name}
                      </h4>
                      <p className="text-[10px] text-zinc-400 font-semibold">{review.role}</p>
                    </div>
                  </div>
                  
                  {/* Rating Stars */}
                  <div className="flex gap-0.5 text-amber-500 shrink-0">
                    {Array.from({ length: review.stars }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                </div>

                {/* Quote Text */}
                <div className="relative">
                  <Quote className="absolute -top-3 -left-2 h-8 w-8 text-pink-500/10 rotate-180" />
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed pl-4">
                    {review.quote}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
