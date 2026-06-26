import { generateMetadata } from '@/lib/seo/metadata'
import type { Metadata } from 'next'
import { LandingHeader } from '@/features/landing/components/landing-header'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  HeroSection,
  WhySection,
  FeaturedBrides,
  FeaturedGrooms,
  SuccessStories,
  HowItWorks,
  AssociateMatchmaker,
  Testimonials,
  BlogSection,
  FaqSection,
  Footer,
  WhatsAppSupport,
} from '@/features/landing'

export const metadata: Metadata = generateMetadata({
  title: 'Find Your Perfect Match | Dil Se Dil Ka Milan',
  description: "India's premium matrimonial platform combining advanced AI matchmaking with personalized human support. 100% verified profile verification.",
  path: '/',
})

export const dynamic = 'force-dynamic'

/**
 * Public redesigned premium home page.
 * Imports and composes feature-level sections in chronological order.
 */
export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF7FA] dark:bg-zinc-950 font-sans antialiased text-[#1A1A1A] dark:text-zinc-150 relative">
      {/* SECTION 1: HEADER */}
      <LandingHeader />

      <main className="flex-grow">
        {/* SECTION 2 & 3: HERO & TRUST BAR */}
        <HeroSection />

        {/* SECTION 4: WHY CHOOSE RISHTAJODO */}
        <WhySection />

        {/* SECTION 5: FEATURED BRIDES */}
        <FeaturedBrides />

        {/* SECTION 6: FEATURED GROOMS */}
        <FeaturedGrooms />

        {/* SECTION 7: SUCCESS STORIES */}
        <SuccessStories />

        {/* SECTION 9: HOW IT WORKS */}
        <HowItWorks />

        {/* SECTION 10: ASSOCIATE MATCHMAKING SECTION */}
        <AssociateMatchmaker />

        {/* SECTION 11: TESTIMONIALS */}
        <Testimonials />

        {/* SECTION 12: BLOGS */}
        <BlogSection />

        {/* SECTION 13: FAQ */}
        <FaqSection />
      </main>

      {/* SECTION 14: FOOTER */}
      <Footer />

      {/* Floating WhatsApp Support Desk */}
      <WhatsAppSupport />
    </div>
  )
}
