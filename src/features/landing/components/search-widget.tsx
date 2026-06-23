'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Search, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RELIGIONS, INDIAN_STATES } from '@/lib/constants'

const EDUCATION_LEVELS = [
  'Bachelors', 'Masters', 'Doctorate', 'Diploma', 'High School', 'Other'
]

const PROFESSIONS = [
  'Software / IT', 'Management / HR', 'Finance / Banking', 'Medicine / Healthcare',
  'Education / Academy', 'Business / Self-Employed', 'Civil Services', 'Other'
]

interface SearchFormData {
  gender: string
  ageFrom: string
  ageTo: string
  religion: string
  location: string
  education: string
  profession: string
}

export function SearchWidget() {
  const router = useRouter()
  const { handleSubmit, setValue, watch } = useForm<SearchFormData>({
    defaultValues: {
      gender: 'female',
      ageFrom: '21',
      ageTo: '30',
      religion: 'Hindu',
      location: 'Delhi',
      education: 'Bachelors',
      profession: 'Software / IT',
    },
  })

  const currentGender = watch('gender')
  const currentAgeFrom = watch('ageFrom')
  const currentAgeTo = watch('ageTo')
  const currentReligion = watch('religion')
  const currentLocation = watch('location')
  const currentEducation = watch('education')
  const currentProfession = watch('profession')

  const onSubmit = (data: SearchFormData) => {
    const params = new URLSearchParams({
      gender: data.gender,
      ageMin: data.ageFrom,
      ageMax: data.ageTo,
      religion: data.religion.toLowerCase(),
      location: data.location,
      education: data.education,
      profession: data.profession,
    })
    router.push(`/search?${params.toString()}`)
  }

  const ages = Array.from({ length: 53 }, (_, i) => (i + 18).toString())

  return (
    <section className="py-16 bg-pink-50/20 dark:bg-zinc-950/40 border-y border-pink-100/60 dark:border-zinc-800/60">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 p-6 md:p-8 shadow-xl shadow-pink-100/10 dark:shadow-none transition-all duration-300">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-5 w-5 text-pink-650 fill-pink-650" />
              <h3 className="font-extrabold text-[#3c0f20] dark:text-white tracking-tight text-lg font-serif">
                Advanced Partner Search Preview
              </h3>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              
              {/* Gender */}
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Looking For</Label>
                <Select
                  onValueChange={(val) => val && setValue('gender', val)}
                  value={currentGender}
                >
                  <SelectTrigger className="h-10 border-zinc-200 focus:ring-pink-500 rounded-lg text-xs">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Bride (Female)</SelectItem>
                    <SelectItem value="male">Groom (Male)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Age Range From/To (grouped in 1 column) */}
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Age Range</Label>
                <div className="flex items-center gap-1">
                  <Select
                    onValueChange={(val) => val && setValue('ageFrom', val)}
                    value={currentAgeFrom}
                  >
                    <SelectTrigger className="h-10 border-zinc-200 focus:ring-pink-500 rounded-lg text-xs flex-1">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {ages.map((age) => (
                        <SelectItem key={`from-${age}`} value={age}>{age}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-[10px] text-zinc-400 font-bold">to</span>
                  <Select
                    onValueChange={(val) => val && setValue('ageTo', val)}
                    value={currentAgeTo}
                  >
                    <SelectTrigger className="h-10 border-zinc-200 focus:ring-pink-500 rounded-lg text-xs flex-1">
                      <SelectValue placeholder="Max" />
                    </SelectTrigger>
                    <SelectContent>
                      {ages.map((age) => (
                        <SelectItem key={`to-${age}`} value={age}>{age}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Religion */}
              <div className="space-y-1.5 col-span-1">
                <Label className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Religion</Label>
                <Select
                  onValueChange={(val) => val && setValue('religion', val)}
                  value={currentReligion}
                >
                  <SelectTrigger className="h-10 border-zinc-200 focus:ring-pink-500 rounded-lg text-xs">
                    <SelectValue placeholder="Select Religion" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELIGIONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location (State) */}
              <div className="space-y-1.5 col-span-1">
                <Label className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Location</Label>
                <Select
                  onValueChange={(val) => val && setValue('location', val)}
                  value={currentLocation}
                >
                  <SelectTrigger className="h-10 border-zinc-200 focus:ring-pink-500 rounded-lg text-xs">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Education */}
              <div className="space-y-1.5 col-span-1">
                <Label className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Education</Label>
                <Select
                  onValueChange={(val) => val && setValue('education', val)}
                  value={currentEducation}
                >
                  <SelectTrigger className="h-10 border-zinc-200 focus:ring-pink-500 rounded-lg text-xs">
                    <SelectValue placeholder="Select Education" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_LEVELS.map((el) => (
                      <SelectItem key={el} value={el}>{el}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Profession */}
              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Profession</Label>
                <Select
                  onValueChange={(val) => val && setValue('profession', val)}
                  value={currentProfession}
                >
                  <SelectTrigger className="h-10 border-zinc-200 focus:ring-pink-500 rounded-lg text-xs">
                    <SelectValue placeholder="Select Profession" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFESSIONS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>

            {/* Quick Search Action */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                className="w-full md:w-auto h-11 px-8 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg shadow-md shadow-pink-200/50 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer text-xs uppercase"
              >
                <Search className="h-4 w-4" />
                Quick Search
              </Button>
            </div>

          </form>
        </div>
      </div>
    </section>
  )
}
