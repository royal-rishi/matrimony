'use client'

import { useState } from 'react'
import { SlidersHorizontal, Heart } from 'lucide-react'
import { LandingHeader } from '@/features/landing/components/landing-header'
import { Footer } from '@/features/landing/components/footer'
import { SearchFilters } from './search-filters'
import { SearchResults } from './search-results'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { SearchFilterOutput } from '../validators/search-validators'
import type { Profile } from '@/types/database'
import { toast } from 'sonner'

interface SearchPageClientProps {
  initialFilters: SearchFilterOutput
  initialProfiles: Profile[]
  initialHasMore: boolean
}

export function SearchPageClient({
  initialFilters,
  initialProfiles,
  initialHasMore,
}: SearchPageClientProps) {
  const [activeFilters, setActiveFilters] = useState<SearchFilterOutput>(initialFilters)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  // Callback to update active search filters
  const handleApplyFilters = (newFilters: SearchFilterOutput) => {
    setActiveFilters(newFilters)
    setIsMobileDrawerOpen(false)
    toast.success('Filters applied successfully.')
  }

  // Callback to reset search filters to initial configuration
  const handleResetFilters = () => {
    setActiveFilters({
      gender: initialFilters.gender,
      ageMin: 18,
      ageMax: 50,
      religion: '',
      caste: '',
      education: '',
      occupation: '',
      incomeMin: 0,
      incomeMax: undefined,
      state: '',
      city: '',
      isVerified: false,
      isPremium: false,
      page: 1,
    })
    setIsMobileDrawerOpen(false)
    toast.success('Filters cleared to defaults.')
  }

  // Triggered when a seeker profile is clicked
  const handleViewDetails = (profileId: string) => {
    window.location.href = `/profile/${profileId}`
  }

  // Count active filter criteria to display on the filter badge
  const getActiveFiltersCount = () => {
    let count = 0
    if (activeFilters.religion) count++
    if (activeFilters.caste) count++
    if (activeFilters.state) count++
    if (activeFilters.city) count++
    if (activeFilters.education) count++
    if (activeFilters.occupation) count++
    if (activeFilters.isVerified) count++
    if (activeFilters.isPremium) count++
    if (activeFilters.ageMin !== 18 || activeFilters.ageMax !== 50) count++
    if (activeFilters.incomeMin !== 0 || activeFilters.incomeMax !== undefined) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 font-sans antialiased text-zinc-900 dark:text-zinc-100">
      <LandingHeader />
      
      <main className="flex-grow">
        {/* Elegant Hero Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent dark:from-pink-950/20 dark:via-zinc-950 dark:to-transparent py-10 border-b border-zinc-200/50 dark:border-zinc-800/60">
          {/* Subtle Pink Rose Glow Background Elements */}
          <div className="absolute top-1/2 left-10 -translate-y-1/2 w-48 h-48 bg-[#E91E63]/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-10 -translate-y-1/2 w-56 h-56 bg-[#FF4081]/5 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 max-w-7xl flex flex-col items-center text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100/60 dark:bg-pink-950/30 text-[#E91E63] text-xs font-bold font-heading border border-pink-200/20 shadow-sm animate-fade-in">
              <Heart className="h-3.5 w-3.5 fill-[#E91E63]" />
              <span>Dil Se Dil Ka Milan</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white font-heading">
              Find Your Soulmate
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
              Explore handpicked verified seekers. Filter matches by location, profession, education, caste, or religious preferences for a secure and premium experience.
            </p>
          </div>
        </div>

        {/* Search Layout Grid */}
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Desktop Left Sticky Sidebar */}
            <aside className="hidden lg:block w-[320px] shrink-0 sticky top-24">
              <SearchFilters
                initialFilters={activeFilters}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
              />
            </aside>

            {/* Mobile Fixed Top Filter Button Bar */}
            <div className="lg:hidden w-full flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800 shadow-md">
              <div>
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 font-heading">Matches</h3>
                <p className="text-xs text-zinc-400">Seeking {activeFilters.gender === 'female' ? 'Brides' : 'Grooms'}</p>
              </div>

              <Sheet open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
                <SheetTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1.5 h-9 text-xs font-semibold border-zinc-200 dark:border-zinc-800 hover:text-[#E91E63] hover:border-[#E91E63]"
                    />
                  }
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </SheetTrigger>
                <SheetContent side="left" className="w-[325px] sm:w-[350px] p-0 border-r border-zinc-250 dark:border-zinc-800">
                  <div className="h-full overflow-y-auto p-4 bg-slate-50 dark:bg-zinc-950">
                    <SheetHeader className="mb-4">
                      <SheetTitle className="text-left font-heading text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <SlidersHorizontal className="h-4.5 w-4.5 text-[#E91E63]" />
                        Search Criteria
                      </SheetTitle>
                    </SheetHeader>
                    <SearchFilters
                      initialFilters={activeFilters}
                      onApplyFilters={handleApplyFilters}
                      onResetFilters={handleResetFilters}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Right Results Grid */}
            <div className="flex-grow w-full">
              <SearchResults
                initialFilters={activeFilters}
                initialProfiles={initialProfiles}
                initialHasMore={initialHasMore}
                onViewDetails={handleViewDetails}
              />
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
