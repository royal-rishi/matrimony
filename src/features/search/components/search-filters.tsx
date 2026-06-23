'use client'

import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SlidersHorizontal, RefreshCw, MapPin, GraduationCap, ShieldCheck, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RELIGIONS, INDIAN_STATES } from '@/lib/constants'
import { searchFilterSchema, type SearchFilterOutput } from '../validators/search-validators'

interface SearchFiltersProps {
  initialFilters: SearchFilterOutput
  onApplyFilters: (filters: SearchFilterOutput) => void
  onResetFilters: () => void
}

export function SearchFilters({ initialFilters, onApplyFilters, onResetFilters }: SearchFiltersProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
  } = useForm<SearchFilterOutput>({
    resolver: zodResolver(searchFilterSchema) as unknown as Resolver<SearchFilterOutput>,
    defaultValues: initialFilters,
  })

  const currentGender = watch('gender')
  const currentReligion = watch('religion') || ''
  const currentState = watch('state') || ''
  const currentIsVerified = watch('isVerified')
  const currentIsPremium = watch('isPremium')

  const onSubmit = (data: SearchFilterOutput) => {
    onApplyFilters(data)
  }

  const handleReset = () => {
    reset({
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
    onResetFilters()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200/50 dark:border-zinc-800 shadow-lg">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 font-heading">
          <SlidersHorizontal className="h-4.5 w-4.5 text-[#E91E63]" />
          Refine Search
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-xs text-zinc-500 hover:text-rose-600 hover:bg-rose-50 flex items-center gap-1 h-8"
        >
          <RefreshCw className="h-3 w-3" />
          Clear All
        </Button>
      </div>

      <div className="space-y-5">
        {/* Gender Choice */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Seeking Gender</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['female', 'male', 'other'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setValue('gender', g)}
                className={`py-2 text-xs font-semibold rounded-lg border capitalize transition-all ${
                  currentGender === g
                    ? 'border-[#E91E63] bg-pink-50/50 text-[#E91E63] dark:bg-pink-950/20'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Age Range */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Age Range</Label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                type="number"
                min={18}
                max={70}
                placeholder="Min"
                className="h-9 text-xs"
                {...register('ageMin', { valueAsNumber: true })}
              />
            </div>
            <span className="text-zinc-400 text-xs">to</span>
            <div className="flex-1">
              <Input
                type="number"
                min={18}
                max={70}
                placeholder="Max"
                className="h-9 text-xs"
                {...register('ageMax', { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>

        {/* Religion */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Religion</Label>
          <Select value={currentReligion} onValueChange={(val) => setValue('religion', val || '')}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="All Religions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Religions</SelectItem>
              {RELIGIONS.map((r) => (
                <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Caste */}
        <div className="space-y-2">
          <Label htmlFor="caste" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Caste / Sub-Caste</Label>
          <Input id="caste" placeholder="E.g., Brahmin, Gupta" className="h-9 text-xs" {...register('caste')} />
        </div>

        {/* Location Section */}
        <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 font-heading">
            <MapPin className="h-3.5 w-3.5 text-zinc-400" />
            Location
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="state" className="text-[10px] text-zinc-400">State</Label>
              <Select value={currentState} onValueChange={(val) => setValue('state', val || '')}>
                <SelectTrigger id="state" className="h-9 text-xs">
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All States</SelectItem>
                  {INDIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="city" className="text-[10px] text-zinc-400">City</Label>
              <Input id="city" placeholder="E.g., Pune" className="h-9 text-xs" {...register('city')} />
            </div>
          </div>
        </div>

        {/* Professional Section */}
        <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 font-heading">
            <GraduationCap className="h-3.5 w-3.5 text-zinc-400" />
            Education & Profession
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="education" className="text-[10px] text-zinc-400">Education</Label>
                <Input id="education" placeholder="E.g., MBA, B.Tech" className="h-9 text-xs" {...register('education')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="occupation" className="text-[10px] text-zinc-400">Occupation</Label>
                <Input id="occupation" placeholder="E.g., Manager" className="h-9 text-xs" {...register('occupation')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] text-zinc-400">Min Annual Income (INR)</Label>
              <Select
                value={watch('incomeMin')?.toString() || '0'}
                onValueChange={(val) => setValue('incomeMin', val ? parseInt(val, 10) : 0)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="No Minimum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No Minimum</SelectItem>
                  <SelectItem value="200000">₹2 Lakh +</SelectItem>
                  <SelectItem value="500000">₹5 Lakh +</SelectItem>
                  <SelectItem value="800000">₹8 Lakh +</SelectItem>
                  <SelectItem value="1200000">₹12 Lakh +</SelectItem>
                  <SelectItem value="2000000">₹20 Lakh +</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Badges & Trust Filters */}
        <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Badges & Trust</Label>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={currentIsVerified}
                onChange={(e) => setValue('isVerified', e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-pink-600 focus:ring-pink-500"
              />
              <span className="flex items-center gap-1 font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-500 fill-emerald-50" />
                KYC-Verified Only
              </span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={currentIsPremium}
                onChange={(e) => setValue('isPremium', e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-pink-600 focus:ring-pink-500"
              />
              <span className="flex items-center gap-1 font-semibold">
                <Heart className="h-4 w-4 text-rose-500 fill-rose-50" />
                Premium Members Only
              </span>
            </label>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-10 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
      >
        Apply Filters
      </Button>
    </form>
  )
}
