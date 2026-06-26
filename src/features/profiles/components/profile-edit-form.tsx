'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, User, BookOpen, Briefcase, IndianRupee, MapPin } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { profileEditSchema, type ProfileEditOutput } from '../validators/profile-validators'
import { updateProfile } from '../actions/profile-actions'
import { RELIGIONS, INDIAN_STATES } from '@/lib/constants'

// Common mother tongues in India
const MOTHER_TONGUES = [
  'Hindi', 'Bengali', 'Marathi', 'Telugu', 'Tamil', 'Gujarati', 'Urdu', 
  'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Other'
]

interface ProfileEditFormProps {
  profile: {
    first_name: string
    last_name: string
    gender: string
    date_of_birth: string
    marital_status: string
    religion: string
    caste?: string | null
    mother_tongue: string
    education?: string | null
    occupation?: string | null
    annual_income?: number | null
    city: string
    state: string
    country: string
  }
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      first_name: profile.first_name,
      last_name: profile.last_name,
      gender: profile.gender as 'male' | 'female' | 'other',
      date_of_birth: profile.date_of_birth,
      marital_status: (profile.marital_status === 'unmarried' ? 'unmarried' : profile.marital_status) as any,
      religion: profile.religion,
      caste: profile.caste || '',
      mother_tongue: profile.mother_tongue,
      education: profile.education || '',
      occupation: profile.occupation || '',
      annual_income: profile.annual_income !== null && profile.annual_income !== undefined ? profile.annual_income.toString() : '',
      city: profile.city,
      state: profile.state,
      country: profile.country || 'India',
    },
  })

  const currentGender = watch('gender')
  const currentMaritalStatus = watch('marital_status')
  const currentReligion = watch('religion')
  const currentMotherTongue = watch('mother_tongue')
  const currentState = watch('state')

  const onSubmit = async (data: unknown) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await updateProfile(data as ProfileEditOutput)
      if (result?.error) {
        setError(result.error)
        toast.error('Failed to update profile')
      } else {
        toast.success('Profile updated successfully!')
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
          <User className="h-5 w-5 text-rose-500" />
          Personal & Professional Information
        </CardTitle>
        <CardDescription>
          Update your personal details, career details, and search location.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-100">
              {error}
            </div>
          )}

          {/* Section 1: Identity */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#E91E63] uppercase tracking-wider border-b border-zinc-100 pb-1.5">
              1. Personal Details
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input id="first_name" disabled={isLoading} {...register('first_name')} />
                {errors.first_name && <p className="text-xs text-rose-600">{errors.first_name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" disabled={isLoading} {...register('last_name')} />
                {errors.last_name && <p className="text-xs text-rose-600">{errors.last_name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={currentGender} onValueChange={(val) => val && setValue('gender', val as 'male' | 'female' | 'other')} disabled={isLoading}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-xs text-rose-600">{errors.gender.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input id="date_of_birth" type="date" disabled={isLoading} {...register('date_of_birth')} />
                {errors.date_of_birth && <p className="text-xs text-rose-600">{errors.date_of_birth.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="marital_status">Marital Status</Label>
                <Select value={currentMaritalStatus} onValueChange={(val) => val && setValue('marital_status', val as 'unmarried' | 'divorced' | 'widowed' | 'awaiting_divorce')} disabled={isLoading}>
                  <SelectTrigger id="marital_status">
                    <SelectValue placeholder="Select Marital Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unmarried">Never Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                    <SelectItem value="awaiting_divorce">Awaiting Divorce</SelectItem>
                  </SelectContent>
                </Select>
                {errors.marital_status && <p className="text-xs text-rose-600">{errors.marital_status.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Religion & Caste */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-[#E91E63] uppercase tracking-wider border-b border-zinc-100 pb-1.5 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              2. Religion & Background
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="religion">Religion</Label>
                <Select value={currentReligion} onValueChange={(val) => val && setValue('religion', val)} disabled={isLoading}>
                  <SelectTrigger id="religion">
                    <SelectValue placeholder="Select Religion" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELIGIONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.religion && <p className="text-xs text-rose-600">{errors.religion.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="caste">Caste (Optional)</Label>
                <Input id="caste" placeholder="E.g., Brahmin, Rajput" disabled={isLoading} {...register('caste')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mother_tongue">Mother Tongue</Label>
                <Select value={currentMotherTongue} onValueChange={(val) => val && setValue('mother_tongue', val)} disabled={isLoading}>
                  <SelectTrigger id="mother_tongue">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTHER_TONGUES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.mother_tongue && <p className="text-xs text-rose-600">{errors.mother_tongue.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Career & Income */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-[#E91E63] uppercase tracking-wider border-b border-zinc-100 pb-1.5 flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" />
              3. Education & Profession
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="education">Highest Education</Label>
                <Input id="education" placeholder="E.g., B.Tech, MBA" disabled={isLoading} {...register('education')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input id="occupation" placeholder="E.g., Business Analyst" disabled={isLoading} {...register('occupation')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="annual_income">Annual Income (INR)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input id="annual_income" placeholder="E.g., 800000" className="pl-9" disabled={isLoading} {...register('annual_income')} />
                </div>
                {errors.annual_income && <p className="text-xs text-rose-600">{errors.annual_income.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 4: Location */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold text-[#E91E63] uppercase tracking-wider border-b border-zinc-100 pb-1.5 flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              4. Current Location
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" disabled={isLoading} {...register('city')} />
                {errors.city && <p className="text-xs text-rose-600">{errors.city.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select value={currentState} onValueChange={(val) => val && setValue('state', val)} disabled={isLoading}>
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && <p className="text-xs text-rose-600">{errors.state.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" disabled={true} {...register('country')} />
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
                Saving Changes...
              </>
            ) : (
              'Save Details'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
