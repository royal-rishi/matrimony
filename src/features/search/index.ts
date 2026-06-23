/**
 * Feature module: search
 * 
 * Query engine and search filters for matchmaking.
 */

// Components
export { SearchFilters } from './components/search-filters'
export { SearchResults } from './components/search-results'
export { ProfileCard } from './components/profile-card'
export { SearchPageClient } from './components/search-client-page'

// Actions
export { searchProfiles } from './actions/search-actions'

// Validators / Schemas
export { searchFilterSchema, type SearchFilterInput, type SearchFilterOutput } from './validators/search-validators'
