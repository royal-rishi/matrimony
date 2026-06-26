'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { 
  Sparkles, Heart, ArrowRight, ArrowLeft, Save, 
  User, Check, Camera, Briefcase, Smile, Coffee, Users, Upload, Loader2, Trash
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { saveOnboardingStep, getOnboardingProgress } from '../actions/onboarding-actions'
import { uploadPhotoAction, deletePhotoAction } from '../actions/profile-actions'
import { RELIGIONS, INDIAN_STATES, EDUCATION_LEVELS } from '@/lib/constants'
import type { Profile } from '@/types/database'

// Local Mother Tongue List
const MOTHER_TONGUES = [
  'Hindi', 'Bengali', 'Marathi', 'Telugu', 'Tamil', 'Gujarati', 'Urdu', 
  'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Maithili', 
  'Santhali', 'Kashmiri', 'Nepali', 'Konkani', 'Sindhi', 'Dogri', 
  'Manipuri', 'Bodo', 'Sanskrit', 'English', 'Other'
]

// Wizard steps metadata
const WIZARD_STEPS = [
  { step: 1, label: 'Basic Info', icon: User, desc: 'Personal details' },
  { step: 2, label: 'Religion', icon: Sparkles, desc: 'Spiritual background' },
  { step: 3, label: 'Career', icon: Briefcase, desc: 'Education & job' },
  { step: 4, label: 'Physicals', icon: Smile, desc: 'Height & weight' },
  { step: 5, label: 'Lifestyle', icon: Coffee, desc: 'Habits & diet' },
  { step: 6, label: 'Family', icon: Users, desc: 'Family setup' },
  { step: 7, label: 'Preferences', icon: Heart, desc: 'Desired partner' },
  { step: 8, label: 'Photos', icon: Camera, desc: 'Upload album' }
]

export function OnboardingWizard() {
  const [activeStep, setActiveStep] = useState(1)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  // React Hook Form
  const { register, handleSubmit, setValue, watch, reset, getValues } = useForm<any>()

  // Load progress and prefill form on mount
  useEffect(() => {
    async function loadProgress() {
      try {
        const result = await getOnboardingProgress()
        if (result.success && result.profile) {
          setProfile(result.profile)
          setActiveStep(result.suggestedStep || 1)
          
          // Flatten partner preferences for form prefill
          const partnerPrefs = result.profile.partner_preferences || {}
          
          reset({
            ...result.profile,
            // step 7 fields
            pref_age_min: partnerPrefs.age_min || 18,
            pref_age_max: partnerPrefs.age_max || 45,
            pref_religion: partnerPrefs.religion || '',
            pref_education: partnerPrefs.education || '',
            pref_state: partnerPrefs.state || '',
            pref_city: partnerPrefs.city || '',
            pref_marital_status: partnerPrefs.marital_status ? partnerPrefs.marital_status[0] : '',
            // hobbies / interests formatting
            hobbies_text: result.profile.hobbies ? result.profile.hobbies.join(', ') : '',
            interests_text: result.profile.interests ? result.profile.interests.join(', ') : '',
          })
        } else {
          toast.error('Failed to load profile data.')
        }
      } catch (err) {
        console.error(err)
        toast.error('Error connecting to database.')
      } finally {
        setIsInitializing(false)
      }
    }
    loadProgress()
  }, [reset])

  // Watch all form fields reactively
  const watchedValues = watch()

  const currentGender = watchedValues?.gender
  const currentMaritalStatus = watchedValues?.marital_status
  const currentCreatedBy = watchedValues?.profile_created_by
  const currentReligion = watchedValues?.religion
  const currentMotherTongue = watchedValues?.mother_tongue
  const currentManglik = watchedValues?.manglik_status
  const currentHoroscope = watchedValues?.horoscope_available
  const currentEducation = watchedValues?.education
  const currentComplexion = watchedValues?.complexion
  const currentBodyType = watchedValues?.body_type
  const currentDiet = watchedValues?.diet
  const currentSmoking = watchedValues?.smoking
  const currentDrinking = watchedValues?.drinking
  const currentFamilyType = watchedValues?.family_type
  const currentFamilyValues = watchedValues?.family_values
  const currentPrefReligion = watchedValues?.pref_religion
  const currentPrefState = watchedValues?.pref_state
  const currentPrefMarital = watchedValues?.pref_marital_status

  // Save current step data to database
  const saveStepData = async (formData: any, stepNumber: number) => {
    setIsSaving(true)
    let payload: Record<string, any> = {}

    // Extract step-specific fields
    if (stepNumber === 1) {
      payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        marital_status: formData.marital_status,
        profile_created_by: formData.profile_created_by || 'Self',
      }
    } else if (stepNumber === 2) {
      payload = {
        religion: formData.religion,
        caste: formData.caste || '',
        sub_caste: formData.sub_caste || '',
        mother_tongue: formData.mother_tongue,
        manglik_status: formData.manglik_status || 'Non-Manglik',
        horoscope_available: !!formData.horoscope_available,
      }
    } else if (stepNumber === 3) {
      payload = {
        education: formData.education,
        college: formData.college || '',
        occupation: formData.occupation || '',
        company: formData.company || '',
        annual_income: formData.annual_income ? parseFloat(formData.annual_income) : null,
      }
    } else if (stepNumber === 4) {
      payload = {
        height: formData.height ? parseInt(formData.height, 10) : null,
        weight: formData.weight ? parseInt(formData.weight, 10) : null,
        complexion: formData.complexion || '',
        body_type: formData.body_type || '',
      }
    } else if (stepNumber === 5) {
      const hobbiesArr = formData.hobbies_text ? formData.hobbies_text.split(',').map((x: string) => x.trim()).filter(Boolean) : []
      const interestsArr = formData.interests_text ? formData.interests_text.split(',').map((x: string) => x.trim()).filter(Boolean) : []
      payload = {
        diet: formData.diet,
        smoking: formData.smoking,
        drinking: formData.drinking,
        hobbies: hobbiesArr,
        interests: interestsArr,
      }
    } else if (stepNumber === 6) {
      payload = {
        father_occupation: formData.father_occupation || '',
        mother_occupation: formData.mother_occupation || '',
        brothers_count: formData.brothers_count ? parseInt(formData.brothers_count, 10) : 0,
        sisters_count: formData.sisters_count ? parseInt(formData.sisters_count, 10) : 0,
        family_type: formData.family_type || '',
        family_values: formData.family_values || '',
      }
    } else if (stepNumber === 7) {
      // Step 7 saves into partner_preferences jsonb
      payload = {
        age_min: formData.pref_age_min ? parseInt(formData.pref_age_min, 10) : 18,
        age_max: formData.pref_age_max ? parseInt(formData.pref_age_max, 10) : 50,
        religion: formData.pref_religion || null,
        education: formData.pref_education || null,
        state: formData.pref_state || null,
        city: formData.pref_city || null,
        marital_status: formData.pref_marital_status ? [formData.pref_marital_status] : [],
      }
    }

    try {
      const result = await saveOnboardingStep(stepNumber, payload)
      if (result.error) {
        toast.error('Failed to auto-save: ' + result.error)
        setIsSaving(false)
        return false
      }
      
      // Update local profile score preview
      if (profile) {
        setProfile({
          ...profile,
          ...payload,
          profile_score: Math.min(100, (profile.profile_score || 0) + 12)
        } as Profile)
      }
      setIsSaving(false)
      return true
    } catch {
      toast.error('Server error saving step progress.')
      setIsSaving(false)
      return false
    }
  }

  const isStepDataFilled = (stepNumber: number): boolean => {
    const getVal = (field: string) => {
      return watchedValues?.[field] || (profile ? (profile as any)[field] : null)
    }

    if (stepNumber === 1) {
      return !!(getVal('first_name') && getVal('last_name') && getVal('gender') && getVal('date_of_birth') && getVal('marital_status'))
    }
    if (stepNumber === 2) {
      return !!(getVal('religion') && getVal('mother_tongue'))
    }
    if (stepNumber === 3) {
      return !!(getVal('education') && getVal('occupation'))
    }
    if (stepNumber === 4) {
      return !!(getVal('height') && getVal('weight'))
    }
    if (stepNumber === 5) {
      return !!getVal('diet')
    }
    if (stepNumber === 6) {
      return !!(getVal('family_type') || getVal('father_occupation'))
    }
    if (stepNumber === 7) {
      return !!(getVal('pref_age_min') && getVal('pref_age_max'))
    }
    if (stepNumber === 8) {
      return !!(profile?.avatar_url || profile?.photos?.length)
    }
    return false
  }

  const handleSkipAndContinue = () => {
    if (!isStepDataFilled(activeStep)) {
      toast.error('All required fields in this step must be filled before continuing.')
      return
    }

    if (activeStep < 8) {
      setActiveStep((prev) => prev + 1)
      toast.info(`Moved to Step ${activeStep + 1} without saving.`)
    } else {
      toast.success('Onboarding complete!')
      router.push('/dashboard')
    }
  }

  // Handle click on next button
  const onNext = async (formData: any) => {
    if (activeStep < 8) {
      const isSaved = await saveStepData(formData, activeStep)
      if (isSaved) {
        setActiveStep((prev) => prev + 1)
        toast.success(`Step ${activeStep} completed & auto-saved!`)
      }
    } else {
      // Step 8 is photos, check if avatar is present
      if (!profile?.avatar_url) {
        toast.error('Please upload at least a Main Profile Photo to proceed.')
        return
      }
      toast.success('Matrimonial profile completed! Welcome to RishtaJodo.')
      router.push('/dashboard')
    }
  }

  // Save current progress as manual draft
  const handleSaveDraft = async () => {
    handleSubmit(async (formData) => {
      const isSaved = await saveStepData(formData, activeStep)
      if (isSaved) {
        toast.success('Matrimonial profile draft saved successfully!')
      }
    })()
  }

  // Handle direct file uploads (for Step 8 Photos)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, _isPrivate = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = async () => {
      const base64 = reader.result as string
      try {
        const result = await uploadPhotoAction(base64, file.name)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Photo uploaded successfully!')
          
          // Re-fetch progress to update album display
          const progress = await getOnboardingProgress()
          if (progress.success && progress.profile) {
            setProfile(progress.profile)
          }
        }
      } catch {
        toast.error('Failed to upload file.')
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleDeletePhoto = async (photoUrl: string) => {
    try {
      const result = await deletePhotoAction(photoUrl)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Photo removed.')
        
        // Re-fetch progress
        const progress = await getOnboardingProgress()
        if (progress.success && progress.profile) {
          setProfile(progress.profile)
        }
      }
    } catch {
      toast.error('Error deleting photo.')
    }
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
          <p className="text-sm font-semibold text-zinc-500">Loading your profile wizard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-55 dark:bg-zinc-950 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Wizard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-6 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 shadow-lg">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight font-heading flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-pink-600 fill-pink-100" />
              Complete Matrimonial Profile
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Provide authentic family backgrounds and details for verified matching.
            </p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Completion percentage score */}
            <div className="flex-grow md:flex-grow-0 space-y-1">
              <div className="flex justify-between text-xs font-bold text-zinc-600 dark:text-zinc-300">
                <span>Profile Score</span>
                <span className="text-pink-600 font-black">{profile?.profile_score || 0}%</span>
              </div>
              <div className="h-2 w-full md:w-36 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200/30">
                <div 
                  className="h-full bg-gradient-to-r from-pink-600 to-rose-500 transition-all duration-500 rounded-full" 
                  style={{ width: `${profile?.profile_score || 0}%` }}
                />
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSaveDraft}
              className="border-zinc-200 text-zinc-650 hover:bg-zinc-50 h-10 px-3.5 text-xs font-semibold gap-1.5 shrink-0"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
          </div>
        </div>

        {/* Wizard Steps Timeline */}
        <div className="hidden lg:grid grid-cols-8 gap-2 bg-zinc-100/60 dark:bg-zinc-900/60 backdrop-blur-sm p-4 rounded-xl border border-zinc-200/30 dark:border-zinc-800">
          {WIZARD_STEPS.map((step) => {
            const StepIcon = step.icon
            const isCompleted = activeStep > step.step
            const isActive = activeStep === step.step
            
            return (
              <button
                key={step.step}
                onClick={() => step.step <= (profile?.profile_score ? Math.ceil(profile.profile_score / 12) + 1 : 1) && setActiveStep(step.step)}
                className={`flex flex-col items-center text-center p-2 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? 'bg-white dark:bg-zinc-850 shadow-sm border border-pink-100 dark:border-pink-900/40 text-pink-600'
                    : isCompleted
                    ? 'text-emerald-600 hover:bg-zinc-200/50'
                    : 'text-zinc-400 hover:text-zinc-600 cursor-not-allowed'
                }`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                  isActive 
                    ? 'bg-pink-600 text-white' 
                    : isCompleted 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'bg-zinc-200 text-zinc-400'
                }`}>
                  {isCompleted ? <Check className="h-4 w-4 stroke-[3px]" /> : <StepIcon className="h-4 w-4" />}
                </div>
                <span className="text-[10px] font-bold mt-1.5 tracking-tight">{step.label}</span>
              </button>
            )
          })}
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 shadow-xl transition-all">
          <form onSubmit={handleSubmit(onNext)} className="space-y-6">
            
            {/* STEP 1: Basic details */}
            {activeStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-zinc-150 dark:border-zinc-800 pb-3">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-serif">Basic Profile Details</h3>
                  <p className="text-xs text-zinc-500">Provide basic identity details for matchmaking validation.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-zinc-700 dark:text-zinc-300 font-semibold">First Name</Label>
                    <Input id="first_name" className="h-10" {...register('first_name')} placeholder="First name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-zinc-700 dark:text-zinc-300 font-semibold">Last Name</Label>
                    <Input id="last_name" className="h-10" {...register('last_name')} placeholder="Last name" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-zinc-700 dark:text-zinc-300 font-semibold">Gender</Label>
                    <Select 
                      onValueChange={(val) => setValue('gender', val)} 
                      value={currentGender}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male (Groom)</SelectItem>
                        <SelectItem value="female">Female (Bride)</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth" className="text-zinc-700 dark:text-zinc-300 font-semibold">Date of Birth</Label>
                    <Input id="date_of_birth" type="date" className="h-10" {...register('date_of_birth')} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="marital_status" className="text-zinc-700 dark:text-zinc-300 font-semibold">Marital Status</Label>
                    <Select 
                      onValueChange={(val) => setValue('marital_status', val)} 
                      value={currentMaritalStatus}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select Marital Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unmarried">Never Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                        <SelectItem value="awaiting_divorce">Awaiting Divorce</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile_created_by" className="text-zinc-700 dark:text-zinc-300 font-semibold">Profile Created By</Label>
                    <Select 
                      onValueChange={(val) => setValue('profile_created_by', val)} 
                      value={currentCreatedBy || 'Self'}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Who is creating this profile?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Self">Self</SelectItem>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Sibling">Sibling</SelectItem>
                        <SelectItem value="Relative">Relative / Guardian</SelectItem>
                        <SelectItem value="Friend">Friend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Religious Details */}
            {activeStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-zinc-150 dark:border-zinc-800 pb-3">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-serif">Religious & Astro Details</h3>
                  <p className="text-xs text-zinc-500">Provide community and caste alignment preferences.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="religion" className="text-zinc-700 dark:text-zinc-300 font-semibold">Religion</Label>
                    <Select 
                      onValueChange={(val) => setValue('religion', val)} 
                      value={currentReligion}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select Religion" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELIGIONS.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mother_tongue" className="text-zinc-700 dark:text-zinc-300 font-semibold">Mother Tongue</Label>
                    <Select 
                      onValueChange={(val) => setValue('mother_tongue', val)} 
                      value={currentMotherTongue}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select Mother Tongue" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOTHER_TONGUES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="caste" className="text-zinc-700 dark:text-zinc-300 font-semibold">Caste</Label>
                    <Input id="caste" className="h-10" {...register('caste')} placeholder="E.g. Brahmin, Rajput, Suniar" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sub_caste" className="text-zinc-700 dark:text-zinc-300 font-semibold">Sub Caste (Optional)</Label>
                    <Input id="sub_caste" className="h-10" {...register('sub_caste')} placeholder="E.g. Vatsa, Bhargav" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="manglik_status" className="text-zinc-700 dark:text-zinc-300 font-semibold">Manglik Status</Label>
                    <Select 
                      onValueChange={(val) => setValue('manglik_status', val)} 
                      value={currentManglik || 'Non-Manglik'}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Manglik Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Non-Manglik">Non-Manglik</SelectItem>
                        <SelectItem value="Manglik">Manglik</SelectItem>
                        <SelectItem value="Anshik">Anshik (Partial)</SelectItem>
                         <SelectItem value="Don't Know">Don&apos;t Know</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200/30">
                    <div className="space-y-0.5">
                      <Label htmlFor="horoscope_available" className="text-zinc-700 dark:text-zinc-300 font-bold">Kundali / Horoscope Available?</Label>
                      <p className="text-[10px] text-zinc-400">Enable if you have matching details ready.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        id="horoscope_available"
                        checked={!!currentHoroscope}
                        onChange={(e) => setValue('horoscope_available', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-650 peer-checked:bg-pink-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Education & Career */}
            {activeStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-zinc-150 dark:border-zinc-800 pb-3">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-serif">Education & Professional Details</h3>
                  <p className="text-xs text-zinc-500">Let matches know about your academic and professional qualifications.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="education" className="text-zinc-700 dark:text-zinc-300 font-semibold">Highest Qualification</Label>
                    <Select 
                      onValueChange={(val) => setValue('education', val)} 
                      value={currentEducation}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select Qualification" />
                      </SelectTrigger>
                      <SelectContent>
                        {EDUCATION_LEVELS.map((el) => (
                          <SelectItem key={el} value={el}>{el}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="college" className="text-zinc-700 dark:text-zinc-300 font-semibold">College / University</Label>
                    <Input id="college" className="h-10" {...register('college')} placeholder="Name of institution" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="occupation" className="text-zinc-700 dark:text-zinc-300 font-semibold">Occupation / Designation</Label>
                    <Input id="occupation" className="h-10" {...register('occupation')} placeholder="E.g. Software Engineer, Doctor" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-zinc-700 dark:text-zinc-300 font-semibold">Company Name</Label>
                    <Input id="company" className="h-10" {...register('company')} placeholder="E.g. Google, Hospital, Self" />
                  </div>
                </div>

                <div className="space-y-2 max-w-md">
                  <Label htmlFor="annual_income" className="text-zinc-700 dark:text-zinc-300 font-semibold">Annual Income (₹ per annum)</Label>
                  <Input 
                    id="annual_income" 
                    type="number" 
                    className="h-10" 
                    {...register('annual_income')} 
                    placeholder="E.g. 1200000 (12 Lakhs)" 
                  />
                </div>
              </div>
            )}

            {/* STEP 4: Physical Attributes */}
            {activeStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-zinc-150 dark:border-zinc-800 pb-3">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-serif">Physical Attributes</h3>
                  <p className="text-xs text-zinc-500">Provide basic physical appearance parameters.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="height" className="text-zinc-700 dark:text-zinc-300 font-semibold">Height (in cm)</Label>
                    <Input id="height" type="number" className="h-10" {...register('height')} placeholder="E.g. 175" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-zinc-700 dark:text-zinc-300 font-semibold">Weight (in kg)</Label>
                    <Input id="weight" type="number" className="h-10" {...register('weight')} placeholder="E.g. 70" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="complexion" className="text-zinc-700 dark:text-zinc-300 font-semibold">Complexion</Label>
                    <Select 
                      onValueChange={(val) => setValue('complexion', val)} 
                      value={currentComplexion}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Complexion type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fair">Fair</SelectItem>
                        <SelectItem value="Very Fair">Very Fair</SelectItem>
                        <SelectItem value="Wheatish">Wheatish</SelectItem>
                        <SelectItem value="Dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body_type" className="text-zinc-700 dark:text-zinc-300 font-semibold">Body Type</Label>
                    <Select 
                      onValueChange={(val) => setValue('body_type', val)} 
                      value={currentBodyType}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Body Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Slim">Slim</SelectItem>
                        <SelectItem value="Athletic">Athletic</SelectItem>
                        <SelectItem value="Average">Average</SelectItem>
                        <SelectItem value="Heavy">Heavy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Lifestyle */}
            {activeStep === 5 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-zinc-150 dark:border-zinc-800 pb-3">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-serif">Lifestyle & Habits</h3>
                  <p className="text-xs text-zinc-500">Provide habits and recreational preferences details.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="diet" className="text-zinc-700 dark:text-zinc-300 font-semibold">Dietary Preference</Label>
                    <Select 
                      onValueChange={(val) => setValue('diet', val)} 
                      value={currentDiet}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Dietary habits" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="Non-Vegetarian">Non-Vegetarian</SelectItem>
                        <SelectItem value="Eggetarian">Eggetarian</SelectItem>
                        <SelectItem value="Vegan">Vegan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smoking" className="text-zinc-700 dark:text-zinc-300 font-semibold">Smoking Habit</Label>
                    <Select 
                      onValueChange={(val) => setValue('smoking', val)} 
                      value={currentSmoking}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Do you smoke?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="Occasionally">Occasionally</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="drinking" className="text-zinc-700 dark:text-zinc-300 font-semibold">Drinking Habit</Label>
                    <Select 
                      onValueChange={(val) => setValue('drinking', val)} 
                      value={currentDrinking}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Do you drink?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Socially">Socially</SelectItem>
                        <SelectItem value="Yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="hobbies_text" className="text-zinc-700 dark:text-zinc-300 font-semibold">Hobbies (Comma Separated)</Label>
                    <Input id="hobbies_text" className="h-10" {...register('hobbies_text')} placeholder="E.g. Reading, Travel, Cooking" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interests_text" className="text-zinc-700 dark:text-zinc-300 font-semibold">Interests (Comma Separated)</Label>
                    <Input id="interests_text" className="h-10" {...register('interests_text')} placeholder="E.g. Photography, Astronomy, Trekking" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Family Details */}
            {activeStep === 6 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-zinc-150 dark:border-zinc-800 pb-3">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-serif">Family Background</h3>
                  <p className="text-xs text-zinc-500">Provide details about your parents and siblings background.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="father_occupation" className="text-zinc-700 dark:text-zinc-300 font-semibold">Father&apos;s Occupation</Label>
                    <Input id="father_occupation" className="h-10" {...register('father_occupation')} placeholder="E.g. Retired Govt Officer, Businessman" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mother_occupation" className="text-zinc-700 dark:text-zinc-300 font-semibold">Mother&apos;s Occupation</Label>
                    <Input id="mother_occupation" className="h-10" {...register('mother_occupation')} placeholder="E.g. Housewife, Teacher" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="brothers_count" className="text-zinc-700 dark:text-zinc-300 font-semibold">Number of Brothers</Label>
                    <Input id="brothers_count" type="number" className="h-10" {...register('brothers_count')} placeholder="E.g. 1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sisters_count" className="text-zinc-700 dark:text-zinc-300 font-semibold">Number of Sisters</Label>
                    <Input id="sisters_count" type="number" className="h-10" {...register('sisters_count')} placeholder="E.g. 2" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="family_type" className="text-zinc-700 dark:text-zinc-300 font-semibold">Family Type</Label>
                    <Select 
                      onValueChange={(val) => setValue('family_type', val)} 
                      value={currentFamilyType}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Joint or Nuclear?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nuclear">Nuclear Family</SelectItem>
                        <SelectItem value="Joint">Joint Family</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="family_values" className="text-zinc-700 dark:text-zinc-300 font-semibold">Family Values</Label>
                    <Select 
                      onValueChange={(val) => setValue('family_values', val)} 
                      value={currentFamilyValues}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select values" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Traditional">Traditional</SelectItem>
                        <SelectItem value="Orthodox">Orthodox</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Liberal">Liberal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: Partner Preferences */}
            {activeStep === 7 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-zinc-150 dark:border-zinc-800 pb-3">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-serif">Partner Preferences</h3>
                  <p className="text-xs text-zinc-500">Define search bounds for compatibility recommendation matching.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-zinc-700 dark:text-zinc-300 font-semibold">Age Bounds (Preferred Years)</Label>
                    <div className="flex items-center gap-3">
                      <Input type="number" {...register('pref_age_min')} className="h-10 text-center" placeholder="Min" />
                      <span className="text-zinc-400">to</span>
                      <Input type="number" {...register('pref_age_max')} className="h-10 text-center" placeholder="Max" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pref_religion" className="text-zinc-700 dark:text-zinc-300 font-semibold">Preferred Religion</Label>
                    <Select 
                      onValueChange={(val) => setValue('pref_religion', val)} 
                      value={currentPrefReligion}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Open to any religion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Any">Any Religion</SelectItem>
                        {RELIGIONS.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="pref_state" className="text-zinc-700 dark:text-zinc-300 font-semibold">Preferred Location (State)</Label>
                    <Select 
                      onValueChange={(val) => setValue('pref_state', val)} 
                      value={currentPrefState}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Open to all states" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Any">Any Location</SelectItem>
                        {INDIAN_STATES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pref_city" className="text-zinc-700 dark:text-zinc-300 font-semibold">Preferred Location (City)</Label>
                    <Input id="pref_city" className="h-10" {...register('pref_city')} placeholder="E.g. Lucknow, Mumbai, or Any" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="pref_marital_status" className="text-zinc-700 dark:text-zinc-300 font-semibold">Preferred Marital Status</Label>
                    <Select 
                      onValueChange={(val) => setValue('pref_marital_status', val)} 
                      value={currentPrefMarital}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Any">Any Marital Status</SelectItem>
                        <SelectItem value="unmarried">Never Married</SelectItem>
                        <SelectItem value="divorced">Divorced / Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 8: Photos Album */}
            {activeStep === 8 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-zinc-150 dark:border-zinc-800 pb-3">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-serif">Upload Matrimonial Album</h3>
                  <p className="text-xs text-zinc-500">Provide real, high-resolution faces. Blur/visibility settings can be adjusted in Privacy Controls.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Column: Avatar / Main Uploader */}
                  <div className="space-y-4">
                    <Label className="text-zinc-700 dark:text-zinc-300 font-bold block">Main Profile Face Photo</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-28 w-28 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 overflow-hidden relative group bg-zinc-50 flex items-center justify-center">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="Profile preview" className="h-full w-full object-cover" />
                        ) : (
                          <Camera className="h-8 w-8 text-zinc-400" />
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <input
                          id="avatar-uploader"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e)}
                          disabled={isUploading}
                        />
                        <Button
                          type="button"
                          onClick={() => document.getElementById('avatar-uploader')?.click()}
                          className="bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs h-9 px-4 rounded-lg flex items-center gap-1.5"
                          disabled={isUploading}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Upload Main Photo
                        </Button>
                        <p className="text-[10px] text-zinc-400">JPG, PNG or WEBP. Max size 10MB.</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Album Photos */}
                  <div className="space-y-4">
                    <Label className="text-zinc-700 dark:text-zinc-300 font-bold block">Album Photos ({profile?.photos?.length || 0})</Label>
                    <input
                      id="album-uploader"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e)}
                      disabled={isUploading}
                    />
                    <Button
                      type="button"
                      onClick={() => document.getElementById('album-uploader')?.click()}
                      variant="outline"
                      className="border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-semibold h-9 px-4 flex items-center gap-1.5"
                      disabled={isUploading}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Add Album Photo
                    </Button>

                    {/* Album grid display */}
                    {profile?.photos && profile.photos.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 pt-2">
                        {profile.photos.map((photo, pIdx) => (
                          <div key={pIdx} className="relative h-16 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 group shadow-sm">
                            <img src={photo} alt={`Album ${pIdx}`} className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(photo)}
                              className="absolute top-1 right-1 bg-black/60 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash className="h-3 w-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-6 border-t border-zinc-150 dark:border-zinc-800 mt-8">
              {/* Back Button - Bottom on mobile, Left on desktop */}
              <div className="w-full sm:w-auto order-3 sm:order-1">
                {activeStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveStep((prev) => prev - 1)}
                    className="w-full sm:w-auto border-zinc-200 text-zinc-700 hover:bg-zinc-50 h-11 px-6 font-semibold justify-center cursor-pointer"
                    disabled={isSaving}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
              </div>

              {/* Next & Save/Continue Buttons - Top/Middle on mobile, Right on desktop */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto order-1 sm:order-2">
                {/* Next button (Continue without save) */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkipAndContinue}
                  className="w-full sm:w-auto border-zinc-200 text-zinc-700 hover:bg-zinc-50 h-11 px-6 font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed justify-center"
                  disabled={isSaving || !isStepDataFilled(activeStep)}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                {/* Save & Continue Button */}
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-bold h-11 px-8 shadow-md shadow-rose-200/50 hover:shadow-lg transition-all duration-300 cursor-pointer justify-center"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : activeStep === 8 ? (
                    <>
                      Finish Onboarding
                      <Check className="h-4 w-4 ml-2 stroke-[3px]" />
                    </>
                  ) : (
                    <>
                      Save & Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
