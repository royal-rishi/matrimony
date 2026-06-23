'use client'

import Link from 'next/link'
import { Heart, Sparkles, UserCheck } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function CtaSection() {
  return (
    <section id="cta-contact" className="py-20 bg-white dark:bg-zinc-950">
      <div className="container mx-auto px-4">
        {/* Call to Action Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#E91E63] to-[#FF4081] text-white p-8 md:p-16 shadow-xl border border-pink-500/20">
          {/* Decorative Background Glows */}
          <div className="absolute top-0 right-0 -z-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 -z-0 h-72 w-72 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
            {/* Logo Heart Icon badge */}
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-2">
              <Heart className="h-8 w-8 text-white fill-white animate-pulse" />
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Begin Your Journey of &quot;Dil Se Dil Ka Milan&quot;
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-pink-50 max-w-2xl mx-auto leading-relaxed">
                Whether you prefer exploring verified profiles on your own with our advanced AI matching, or want a dedicated Matchmaker Associate to guide you, Rishtajodo has you covered.
              </p>
            </div>

            {/* Micro Highlights */}
            <div className="flex flex-wrap justify-center gap-4 text-xs font-medium text-pink-100">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                <UserCheck className="h-3.5 w-3.5" />
                100% Verified Members
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                <Sparkles className="h-3.5 w-3.5" />
                AI Value Matching
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                <Heart className="h-3.5 w-3.5" />
                Human Matchmaking Support
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  "w-full sm:w-auto h-12 px-8 bg-white hover:bg-pink-50 text-[#E91E63] hover:text-[#E91E63] font-bold shadow-md transition-all duration-300 rounded-lg text-base transform hover:scale-[1.02] flex items-center justify-center"
                )}
              >
                Register Free Now
              </Link>
              <Link
                href="/contact"
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  "w-full sm:w-auto h-12 px-8 bg-transparent hover:bg-white/10 text-white border-white/40 hover:border-white font-bold transition-all duration-300 rounded-lg text-base flex items-center justify-center"
                )}
              >
                Talk to a Matchmaker
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
