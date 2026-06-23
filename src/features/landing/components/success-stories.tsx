/* eslint-disable @next/next/no-img-element */
import { createClient } from '@/lib/supabase/server'
import { Heart, MapPin, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export async function SuccessStories() {
  let stories: any[] = []

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('marriage_successes')
      .select(`
        id,
        marriage_date,
        success_story,
        photos,
        groom:profiles!marriage_successes_groom_id_fkey(first_name, last_name, city, state),
        bride:profiles!marriage_successes_bride_id_fkey(first_name, last_name, city, state)
      `)
      .eq('is_featured', true)
      .eq('verified_by_admin', true)
      .order('created_at', { ascending: false })
      .limit(3)

    if (error) throw error
    stories = data || []
  } catch (e: any) {
    console.error('Error fetching success stories:', e)
  }

  // Fallback static data if database is empty or fails
  const fallbackStories = [
    {
      id: 'mock-success-1',
      marriage_date: '2025-12-12',
      success_story: 'Pooja and Rohan matched through our Local Associate, who facilitated the initial family meeting. Their values aligned instantly, leading to a beautiful wedding.',
      photos: ['https://images.unsplash.com/photo-1621616875450-79f22448040e?w=600&auto=format&fit=crop&q=80'],
      groom: { first_name: 'Rohan', last_name: 'Kapoor', city: 'Lucknow', state: 'Uttar Pradesh' },
      bride: { first_name: 'Pooja', last_name: 'Sharma', city: 'Lucknow', state: 'Uttar Pradesh' }
    },
    {
      id: 'mock-success-2',
      marriage_date: '2026-01-24',
      success_story: 'Amit and Neha used our AI compatibility search. After scoring 94% compatibility, they connected online and found their shared love for art and travel.',
      photos: ['https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?w=600&auto=format&fit=crop&q=80'],
      groom: { first_name: 'Amit', last_name: 'Goel', city: 'Mumbai', state: 'Maharashtra' },
      bride: { first_name: 'Neha', last_name: 'Joshi', city: 'Mumbai', state: 'Maharashtra' }
    },
    {
      id: 'mock-success-3',
      marriage_date: '2026-02-18',
      success_story: 'Rajesh registered through a local associate in Indore. Within a month, he was recommended Kavita. The associate coordinated pre-wedding visits for both families.',
      photos: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80'],
      groom: { first_name: 'Rajesh', last_name: 'Varma', city: 'Indore', state: 'Madhya Pradesh' },
      bride: { first_name: 'Kavita', last_name: 'Patel', city: 'Indore', state: 'Madhya Pradesh' }
    }
  ]

  const displayStories = stories.length > 0 ? stories : fallbackStories

  // Helper to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Recent'
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <section id="success-stories" className="py-20 bg-white dark:bg-zinc-950 border-b border-pink-100/60 dark:border-zinc-900/60">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-50 dark:bg-pink-950/40 border border-pink-100/50 dark:border-pink-900/40 text-[10px] font-bold tracking-widest text-pink-650 dark:text-pink-400 uppercase">
            <Heart className="h-3 w-3 fill-pink-500/10" />
            Unified Hearts
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#3c0f20] dark:text-white font-serif">
            Recent Success Stories
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Read how Jodo Matrimony couples found their perfect lifelong counterparts through curated family connections.
          </p>
        </div>

        {/* Stories Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayStories.map((story) => {
            const groomName = story.groom ? `${story.groom.first_name}` : 'Groom'
            const brideName = story.bride ? `${story.bride.first_name}` : 'Bride'
            const coupleName = `${groomName} & ${brideName}`
            const location = story.bride?.city ? `${story.bride.city}, ${story.bride.state}` : 'India'
            const photoUrl = story.photos?.[0] || 'https://images.unsplash.com/photo-1621616875450-79f22448040e?w=600&auto=format&fit=crop&q=80'

            return (
              <Card
                key={story.id}
                className="overflow-hidden border-zinc-200/50 shadow-md hover:shadow-xl dark:border-zinc-800/50 bg-white dark:bg-zinc-900/60 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between"
              >
                <div>
                  {/* Couple Image Banner */}
                  <div className="relative aspect-[16/10] w-full bg-pink-50/50 dark:bg-zinc-950/60 border-b border-zinc-100 dark:border-zinc-800">
                    <img
                      src={photoUrl}
                      alt={coupleName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center text-pink-650 shadow-md">
                      <Heart className="h-4 w-4 fill-pink-500" />
                    </div>
                  </div>

                  <CardHeader className="p-5 pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-extrabold text-zinc-900 dark:text-white tracking-tight">
                          {coupleName}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold mt-1">
                          <Calendar className="h-3 w-3 text-pink-600" />
                          <span>Married on {formatDate(story.marriage_date)}</span>
                        </div>
                      </div>
                    </div>

                    <Badge className="bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-900/40 hover:bg-pink-50 text-[9px] rounded-full px-2 py-0.5 flex items-center gap-1 w-fit mt-2">
                      <MapPin className="h-2.5 w-2.5 text-pink-600" />
                      {location}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent className="p-5 pt-2">
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed italic">
                      &ldquo;{story.success_story}&rdquo;
                    </p>
                  </CardContent>
                </div>
              </Card>
            )
          })}
        </div>

        {/* View More Stories Button */}
        <div className="text-center pt-12">
          <Link
            href="/register"
            className="inline-flex h-11 px-8 border border-pink-600 text-pink-600 bg-white dark:bg-zinc-900 hover:bg-pink-50/50 font-bold rounded-lg text-xs uppercase tracking-wider items-center justify-center shadow-sm transition-all duration-300"
          >
            View More Success Stories
          </Link>
        </div>

      </div>
    </section>
  )
}
