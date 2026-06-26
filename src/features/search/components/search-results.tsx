'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { ProfileCard } from './profile-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { searchProfiles } from '../actions/search-actions'
import type { SearchFilterOutput } from '../validators/search-validators'
import type { Profile } from '@/types/database'
import { toast } from 'sonner'

interface SearchResultsProps {
  initialFilters: SearchFilterOutput
  initialProfiles: Profile[]
  initialHasMore: boolean
  onSendInterest?: (profileId: string) => Promise<void>
  onViewDetails?: (profileId: string) => void
  interestsSentIds?: Set<string>
}

export function SearchResults({
  initialFilters,
  initialProfiles,
  initialHasMore,
  onSendInterest,
  onViewDetails,
  interestsSentIds,
}: SearchResultsProps) {
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)
  const [page, setPage] = useState(initialFilters.page || 1)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Store the active filters string representation to track changes
  const activeFiltersRef = useRef<SearchFilterOutput>(initialFilters)
  const observerTarget = useRef<HTMLDivElement | null>(null)

  // Function to load the next page of results
  const loadNextPage = useCallback(async (pageNum: number, currentFilters: SearchFilterOutput, append = true) => {
    if (isLoading) return
    setIsLoading(true)

    try {
      const filtersWithPage = { ...currentFilters, page: pageNum }
      const res = await searchProfiles(filtersWithPage)
      
      if (res.error) {
        toast.error(res.error)
        return
      }

      if (res.data) {
        const newProfiles = res.data.profiles
        
        setProfiles((prev) => {
          if (!append) return newProfiles
          // Prevent duplicate profile IDs
          const existingIds = new Set(prev.map((p) => p.id))
          const filteredNew = newProfiles.filter((p) => !existingIds.has(p.id))
          return [...prev, ...filteredNew]
        })
        
        setHasMore(res.data.hasMore)
        setPage(pageNum)
      }
    } catch {
      toast.error('Something went wrong. Please check your connection.')
    } finally {
      setIsLoading(false)
      setIsResetting(false)
    }
  }, [isLoading])

  // Track filter changes. If filters change, reset the search to page 1.
  useEffect(() => {
    const isDifferentFilter = JSON.stringify(activeFiltersRef.current) !== JSON.stringify(initialFilters)
    
    if (isDifferentFilter) {
      activeFiltersRef.current = initialFilters
      setIsResetting(true)
      setPage(1)
      setHasMore(true)
      // Call loadNextPage with page 1, current filters, and append = false
      loadNextPage(1, initialFilters, false)
    }
  }, [initialFilters, loadNextPage])

  // IntersectionObserver callback for infinite scrolling
  useEffect(() => {
    const target = observerTarget.current
    if (!target || !hasMore || isLoading || isResetting) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadNextPage(page + 1, activeFiltersRef.current, true)
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )

    observer.observe(target)
    return () => {
      if (target) observer.unobserve(target)
    }
  }, [hasMore, isLoading, isResetting, page, loadNextPage])

  // Render skeletons while fetching or resetting
  const renderSkeletons = () => {
    return Array.from({ length: 4 }).map((_, index) => (
      <div key={`skeleton-${index}`} className="flex flex-col h-full rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        {/* Photo aspect ratio skeleton */}
        <div className="relative aspect-[4/5] w-full bg-zinc-150 dark:bg-zinc-800 animate-pulse flex items-center justify-center">
          <Heart className="h-10 w-10 text-zinc-200 dark:text-zinc-700 fill-zinc-200 dark:fill-zinc-700 opacity-60" />
        </div>
        {/* Detail skeleton */}
        <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-2.5">
            <Skeleton className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <Skeleton className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Skeleton className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <Skeleton className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <Skeleton className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <Skeleton className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          </div>
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-9 flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <Skeleton className="h-9 flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          </div>
        </div>
      </div>
    ))
  }

  // Handle empty state
  if (!isResetting && profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 shadow-md">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-pink-100 dark:bg-pink-950/30 rounded-full scale-125 blur-sm opacity-50" />
          <div className="relative bg-gradient-to-tr from-pink-500 to-rose-400 p-5 rounded-full text-white shadow-md">
            <Heart className="h-10 w-10 fill-pink-100/10 text-white" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 font-heading">
          No Profiles Found
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">
          We couldn&apos;t find any active seekers matching these filter conditions. Try broadening your preferences (e.g. wider age limits or removing specific castes/locations).
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Stats */}
      <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400 font-semibold px-1">
        <span>Showing {profiles.length} potential matches</span>
        {isLoading && (
          <span className="flex items-center gap-1 text-[#E91E63]">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading more...
          </span>
        )}
      </div>

      {/* Grid of Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {isResetting ? (
          renderSkeletons()
        ) : (
          <>
            {profiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onSendInterest={onSendInterest}
                onViewDetails={onViewDetails}
                initialInterestSent={interestsSentIds?.has(profile.id)}
              />
            ))}
            {isLoading && hasMore && renderSkeletons()}
          </>
        )}
      </div>

      {/* Intersection Observer Sentinel for Infinite Scroll */}
      <div
        ref={observerTarget}
        className="w-full h-10 flex items-center justify-center"
      >
        {!isLoading && hasMore && (
          <Button
            variant="ghost"
            onClick={() => loadNextPage(page + 1, activeFiltersRef.current, true)}
            className="text-xs text-zinc-400 hover:text-rose-500"
          >
            Load more profiles
          </Button>
        )}
      </div>
    </div>
  )
}
