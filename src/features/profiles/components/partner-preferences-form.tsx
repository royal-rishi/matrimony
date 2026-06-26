'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Heart, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { partnerPreferencesSchema, type PartnerPreferencesOutput } from '../validators/profile-validators'
import { updatePartnerPreferences } from '../actions/profile-actions'
import { RELIGIONS, INDIAN_STATES } from '@/lib/constants'

const MOTHER_TONGUES = [
  'Hindi', 'Bengali', 'Marathi', 'Telugu', 'Tamil', 'Gujarati', 'Urdu', 
  'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Other'
]

const MARITAL_STATUS_OPTIONS = [
  { value: 'unmarried', label: 'Never Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'awaiting_divorce', label: 'Awaiting Divorce' }
]

interface PartnerPreferencesFormProps {
  preferences: {
    age_min?: number
    age_max?: number
    marital_status?: string[]
    religion?: string | null
    mother_tongue?: string | null
    state?: string | null
    city?: string | null
    education?: string | null
  } | null
}

export function PartnerPreferencesForm({ preferences }: PartnerPreferencesFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial preferences with safe fallbacks
  const initialPrefs = preferences || {}
  const initialMarital = initialPrefs.marital_status || []

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PartnerPreferencesOutput>({
    resolver: zodResolver(partnerPreferencesSchema),
    defaultValues: {
      ageMin: initialPrefs.age_min || 21,
      ageMax: initialPrefs.age_max || 35,
      maritalStatus: initialMarital,
      religion: initialPrefs.religion || '',
      motherTongue: initialPrefs.mother_tongue || '',
      state: initialPrefs.state || '',
      city: initialPrefs.city || '',
      education: initialPrefs.education || '',
    },
  })

  const currentReligion = watch('religion')
  const currentMotherTongue = watch('motherTongue')
  const currentState = watch('state')
  const selectedMaritalStatus = watch('maritalStatus') || []

  // Handles custom multiselect toggle for marital status options
  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      setValue('maritalStatus', [...selectedMaritalStatus, value])
    } else {
      setValue('maritalStatus', selectedMaritalStatus.filter((status) => status !== value))
    }
  }

  const onSubmit = async (data: PartnerPreferencesOutput) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await updatePartnerPreferences(data)
      if (result?.error) {
        setError(result.error)
        toast.error('Failed to update partner preferences')
      } else {
        toast.success('Partner preferences updated successfully!')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-zinc-200/50 shadow-lg bg-white/95 dark:bg-zinc-900/95">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500 fill-rose-500/20" />
          Partner Preferences
        </CardTitle>
        <CardDescription>
          Specify your expectations. Our AI matching engine filters candidates based on these values.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-100">
              {error}
            </div>
          )}

          {/* Age range inputs */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#E91E63] uppercase tracking-wider border-b border-zinc-100 pb-1.5 flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              1. Age Bracket
            </h3>
            <div className="grid grid-cols-2 gap-4 max-w-sm">
              <div className="space-y-2">
                <Label htmlFor="ageMin">Minimum Age</Label>
                <Input id="ageMin" type="number" min={18} max={70} disabled={isLoading} {...register('ageMin', { valueAsNumber: true })} />
                {errors.ageMin && <p className="text-xs text-rose-600">{errors.ageMin.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ageMax">Maximum Age</Label>
                <Input id="ageMax" type="number" min={18} max={70} disabled={isLoading} {...register('ageMax', { valueAsNumber: true })} />
                {errors.ageMax && <p className="text-xs text-rose-600">{errors.ageMax.message}</p>}
              </div>
            </div>
          </div>

          {/* Marital Status Checkboxes */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-[#E91E63] uppercase tracking-wider border-b border-zinc-100 pb-1.5">
              2. Preferred Marital Status
            </h3>
            <div className="grid grid-cols-2 gap-3 max-w-lg">
              {MARITAL_STATUS_OPTIONS.map((opt) => {
                const isChecked = selectedMaritalStatus.includes(opt.value)
                return (
                  <div key={opt.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`marital-${opt.value}`}
                      checked={isChecked}
                      disabled={isLoading}
                      onChange={(e) => handleCheckboxChange(opt.value, e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-rose-600 focus:ring-rose-500 accent-rose-600 transition-all cursor-pointer"
                    />
                    <Label htmlFor={`marital-${opt.value}`} className="cursor-pointer font-normal text-zinc-700 dark:text-zinc-300">
                      {opt.label}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Background and Location preferences */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-[#E91E63] uppercase tracking-wider border-b border-zinc-100 pb-1.5">
              3. Background & Location
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pref-religion">Preferred Religion</Label>
                <Select value={currentReligion || 'Any'} onValueChange={(val) => setValue('religion', val === 'Any' ? '' : val)} disabled={isLoading}>
                  <SelectTrigger id="pref-religion">
                    <SelectValue placeholder="Any Religion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any">Any Religion</SelectItem>
                    {RELIGIONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pref-tongue">Preferred Mother Tongue</Label>
                <Select value={currentMotherTongue || 'Any'} onValueChange={(val) => setValue('motherTongue', val === 'Any' ? '' : val)} disabled={isLoading}>
                  <SelectTrigger id="pref-tongue">
                    <SelectValue placeholder="Any Mother Tongue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any">Any Language</SelectItem>
                    {MOTHER_TONGUES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pref-state">Preferred State Location</Label>
                <Select value={currentState || 'Any'} onValueChange={(val) => setValue('state', val === 'Any' ? '' : val)} disabled={isLoading}>
                  <SelectTrigger id="pref-state">
                    <SelectValue placeholder="Any Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any">Any State</SelectItem>
                    {INDIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pref-city">Preferred City Location</Label>
                <Input id="pref-city" disabled={isLoading} {...register('city')} placeholder="E.g. Mumbai, Lucknow, or Any" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pref-education">Preferred Highest Education</Label>
                <Select value={watch('education') || 'Any'} onValueChange={(val) => setValue('education', val === 'Any' ? '' : val)} disabled={isLoading}>
                  <SelectTrigger id="pref-education">
                    <SelectValue placeholder="Any Education Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any">Any Education Level</SelectItem>
                    <SelectItem value="doctorate">Doctorate / Ph.D.</SelectItem>
                    <SelectItem value="masters">Masters / Post Graduation</SelectItem>
                    <SelectItem value="bachelors">Bachelors / Graduation</SelectItem>
                    <SelectItem value="diploma">Diploma Course</SelectItem>
                    <SelectItem value="school">High School</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end border-t border-zinc-100 dark:border-zinc-800/80 p-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="h-10 px-6 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-semibold rounded-lg shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Filters...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
