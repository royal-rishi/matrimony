import { createClient } from '@/lib/supabase/server'
import { SearchPageClient } from '@/features/search'
import { searchProfiles } from '@/features/search/actions/search-actions'
import { searchFilterSchema } from '@/features/search/validators/search-validators'
import { generateMetadata } from '@/lib/seo/metadata'
import type { Metadata } from 'next'
import type { Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = generateMetadata({
  title: 'Search Soulmates | Dil Se Dil Ka Milan',
  description: 'Search premium matrimonial profiles by age, religion, caste, occupation, education, and location. Dil Se Dil Ka Milan.',
  path: '/search',
})

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function SearchPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams
  const supabase = await createClient()

  // 1. Determine default seeking gender preference based on user profile
  let defaultGender: 'male' | 'female' | 'other' = 'female'

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('gender')
        .eq('id', user.id)
        .single()

      if (profile) {
        const userGender = (profile as Profile).gender
        defaultGender = userGender === 'male' ? 'female' : 'male'
      }
    }
  } catch {
    // Fail silently, default seeker gender preference is 'female'
  }

  // 2. Parse and sanitize search query parameters from URL
  const rawGender = (resolvedParams.gender as string) || defaultGender
  const parsedFilters = {
    gender: rawGender === 'male' || rawGender === 'female' || rawGender === 'other' ? rawGender : defaultGender,
    ageMin: resolvedParams.ageMin ? parseInt(resolvedParams.ageMin as string, 10) : 18,
    ageMax: resolvedParams.ageMax ? parseInt(resolvedParams.ageMax as string, 10) : 50,
    religion: (resolvedParams.religion as string) || undefined,
    caste: (resolvedParams.caste as string) || undefined,
    education: (resolvedParams.education as string) || undefined,
    occupation: (resolvedParams.occupation as string) || undefined,
    incomeMin: resolvedParams.incomeMin ? parseInt(resolvedParams.incomeMin as string, 10) : 0,
    incomeMax: resolvedParams.incomeMax ? parseInt(resolvedParams.incomeMax as string, 10) : undefined,
    state: (resolvedParams.state as string) || undefined,
    city: (resolvedParams.city as string) || undefined,
    isVerified: resolvedParams.isVerified === 'true' || resolvedParams.isVerified === 'TRUE',
    isPremium: resolvedParams.isPremium === 'true' || resolvedParams.isPremium === 'TRUE',
    page: resolvedParams.page ? parseInt(resolvedParams.page as string, 10) : 1,
  }

  // 3. Validate parsed filters against Zod schema
  const validated = searchFilterSchema.safeParse(parsedFilters)
  const activeFilters = validated.success ? validated.data : {
    gender: defaultGender,
    ageMin: 18,
    ageMax: 50,
    religion: undefined,
    caste: undefined,
    education: undefined,
    occupation: undefined,
    incomeMin: 0,
    incomeMax: undefined,
    state: undefined,
    city: undefined,
    isVerified: false,
    isPremium: false,
    page: 1,
  }

  // 4. Fetch initial search results server-side for fast rendering
  let initialProfiles: Profile[] = []
  let initialHasMore = false

  const response = await searchProfiles(activeFilters)
  if (!response.error && response.data) {
    initialProfiles = response.data.profiles
    initialHasMore = response.data.hasMore
  }

  return (
    <SearchPageClient
      initialFilters={activeFilters}
      initialProfiles={initialProfiles}
      initialHasMore={initialHasMore}
    />
  )
}
