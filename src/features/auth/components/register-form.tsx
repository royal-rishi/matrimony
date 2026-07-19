'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Loader2, Mail, Lock, AlertCircle, Phone, Sparkles, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { registerSchema, type RegisterInput } from '../validators/auth-validators'
import { signUpAction } from '../actions/auth-actions'
import { RELIGIONS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'

export function RegisterForm() {
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [regMethod, setRegMethod] = useState<'email' | 'otp'>('email')
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request')
  const [otpSentMobile, setOtpSentMobile] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema) as unknown as import('react-hook-form').Resolver<RegisterInput>,
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
      confirm_password: '',
      first_name: '',
      last_name: '',
      gender: undefined,
      date_of_birth: '',
      religion: '',
      mobile_number: '',
      referral_code: '',
    },
  })

  // Watch fields for rendering previews
  const currentGender = watch('gender')
  const currentReligion = watch('religion')
  const currentMobile = watch('mobile_number')

  // Validate step 1 fields before moving to step 2
  const handleNext = async () => {
    let fieldsToValidate: Array<keyof RegisterInput> = []

    if (regMethod === 'email') {
      fieldsToValidate = ['email', 'password', 'confirm_password']
    } else {
      // For OTP method, step 1 is credential entry
      fieldsToValidate = ['email']
    }

    const isStepValid = await trigger(fieldsToValidate)
    if (isStepValid) {
      setStep(2)
    }
  }

  const handleBack = () => {
    setStep(1)
  }

  // Handle standard registration form submission
  const onSubmit = async (data: RegisterInput) => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await signUpAction(data)
      if (result?.error) {
        setError(result.error)
        if (result.error.toLowerCase().includes('email') || result.error.toLowerCase().includes('user')) {
          setStep(1)
        }
      } else {
        toast.success('Registration successful!', {
          description: 'Account created! Redirecting to login to verify and begin onboarding.',
        })
        router.push('/login?registered=true')
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during signup. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Mobile OTP registration simulation
  const handleSendMobileOtp = async () => {
    if (!currentMobile || currentMobile.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number first.')
      return;
    }
    setIsLoading(true)
    setError(null)

    try {
      // Check if mobile is already registered before sending OTP
      const { checkMobileExistsAction } = await import('../actions/auth-actions')
      const check = await checkMobileExistsAction(currentMobile)
      if (check?.exists) {
        setError('This mobile number is already linked to an account. Please log in instead.')
        setIsLoading(false)
        return
      }
    } catch {
      // If check fails, proceed anyway — server will catch it at registration
    }

    // Simulate sending OTP SMS code
    setTimeout(() => {
      setIsLoading(false)
      setOtpSentMobile(currentMobile)
      setOtpStep('verify')
      toast.success('Verification code sent!', {
        description: 'Simulated 6-digit SMS code sent to ' + currentMobile + ' (Enter 123456 to verify)',
      })
    }, 800)
  }

  // Verify simulated Mobile OTP and submit registration
  const handleVerifyMobileOtp = async () => {
    if (verificationCode !== '123456') {
      setError('Invalid SMS verification code. Please try again (Use 123456).')
      return;
    }
    setError(null)
    setIsLoading(true)

    // Build values and call signUp
    handleSubmit(async (data) => {
      try {
        const mockEmail = `mobile_${data.mobile_number}@rishtajodo.com`
        const mockPassword = `mobile_${data.mobile_number}_pass`
        const signupData = {
          ...data,
          email: mockEmail,
          password: mockPassword,
          confirm_password: mockPassword,
        }
        const result = await signUpAction(signupData)
        if (result?.error) {
          setError(result.error)
        } else {
          toast.success('OTP Verified! Registration complete.', {
            description: 'Redirecting to login with mobile credentials.',
          })
          router.push(`/login?registered=true&email=${mockEmail}`)
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred during mobile registration.')
      } finally {
        setIsLoading(false)
      }
    })()
  }

  // Google OAuth registration helper
  const handleGoogleSignUp = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
        },
      })
      if (oauthErr) {
        setError(oauthErr.message)
      }
    } catch {
      setError('Failed to initiate Google authentication. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-lg border-zinc-200/50 shadow-xl shadow-zinc-100/50 bg-white/80 backdrop-blur-md transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center mb-2">
          <Sparkles className="h-6 w-6 text-pink-600" />
        </div>
        <CardTitle className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent font-heading">
          Dil se Dil ka Milan
        </CardTitle>
        <CardDescription className="text-zinc-500 text-sm">
          Create your premium matrimonial profile in under 2 minutes
        </CardDescription>

        {/* Step Indicator */}
        <div className="flex items-center justify-between pt-4 pb-2 px-6 max-w-xs mx-auto">
          <div className="flex flex-col items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
              step >= 1 ? 'bg-pink-600 text-white shadow-md shadow-pink-200' : 'bg-zinc-100 text-zinc-400'
            }`}>
              1
            </div>
            <span className="text-[10px] font-bold text-zinc-500 mt-1">Credentials</span>
          </div>
          <div className={`flex-1 h-0.5 mx-4 bg-zinc-200 transition-all duration-500 ${step >= 2 ? 'bg-pink-600' : ''}`} />
          <div className="flex flex-col items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
              step >= 2 ? 'bg-pink-600 text-white shadow-md shadow-pink-200' : 'bg-zinc-100 text-zinc-400'
            }`}>
              2
            </div>
            <span className="text-[10px] font-bold text-zinc-500 mt-1">Details</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-sm flex items-start gap-2 border border-rose-100 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-semibold">Sign Up Failed</p>
              <p className="text-xs text-rose-600">{error}</p>
            </div>
          </div>
        )}

        {/* Tab Selection (only visible in Step 1) */}
        {step === 1 && (
          <Tabs value={regMethod} onValueChange={(val) => setRegMethod(val as 'email' | 'otp')} className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-2 p-1 bg-zinc-150 rounded-lg">
              <TabsTrigger value="email" className="text-xs font-bold py-2">Email Signup</TabsTrigger>
              <TabsTrigger value="otp" className="text-xs font-bold py-2">Mobile OTP</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* STEP 1: Account setup */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {regMethod === 'email' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-zinc-700 font-semibold">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        className="pl-10 h-10 border-zinc-200 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                        disabled={isLoading}
                        {...register('email')}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-zinc-700 font-semibold">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-10 border-zinc-200 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                        disabled={isLoading}
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password" className="text-zinc-700 font-semibold">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                      <Input
                        id="confirm_password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-10 border-zinc-200 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                        disabled={isLoading}
                        {...register('confirm_password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 transition-colors"
                        tabIndex={-1}
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirm_password && (
                      <p className="text-xs text-rose-600 mt-1">{errors.confirm_password.message}</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-pink-50/50 border border-pink-100 text-xs text-pink-700 space-y-1">
                    <p className="font-bold">Mobile OTP Registration Option</p>
                    <p>Enter your email address to associate credentials, then verify your phone number via OTP on Step 2.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-otp" className="text-zinc-700 font-semibold">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                      <Input
                        id="email-otp"
                        type="email"
                        placeholder="name@example.com"
                        className="pl-10 h-10 border-zinc-200 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                        disabled={isLoading}
                        {...register('email')}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Basic Matrimony Details (Fast) */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-zinc-700 font-semibold">First Name</Label>
                  <Input
                    id="first_name"
                    placeholder="E.g. Rajesh"
                    className="h-10 border-zinc-200 focus-visible:ring-rose-500"
                    disabled={isLoading}
                    {...register('first_name')}
                  />
                  {errors.first_name && (
                    <p className="text-xs text-rose-600 mt-1">{errors.first_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-zinc-700 font-semibold">Last Name</Label>
                  <Input
                    id="last_name"
                    placeholder="E.g. Kumar"
                    className="h-10 border-zinc-200 focus-visible:ring-rose-500"
                    disabled={isLoading}
                    {...register('last_name')}
                  />
                  {errors.last_name && (
                    <p className="text-xs text-rose-600 mt-1">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-zinc-700 font-semibold">Gender</Label>
                  <Select
                    onValueChange={(val) => setValue('gender', val as 'male' | 'female' | 'other', { shouldValidate: true })}
                    value={currentGender}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-10 border-zinc-200">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male (Groom)</SelectItem>
                      <SelectItem value="female">Female (Bride)</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-xs text-rose-600 mt-1">{errors.gender.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth" className="text-zinc-700 font-semibold">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    className="h-10 border-zinc-200 focus-visible:ring-rose-500"
                    disabled={isLoading}
                    {...register('date_of_birth')}
                  />
                  {errors.date_of_birth && (
                    <p className="text-xs text-rose-600 mt-1">{errors.date_of_birth.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="religion" className="text-zinc-700 font-semibold">Religion</Label>
                  <Select
                    onValueChange={(val) => setValue('religion', val as string, { shouldValidate: true })}
                    value={currentReligion}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-10 border-zinc-200">
                      <SelectValue placeholder="Select Religion" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELIGIONS.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.religion && (
                    <p className="text-xs text-rose-600 mt-1">{errors.religion.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile_number" className="text-zinc-700 font-semibold">Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <Input
                      id="mobile_number"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      className="pl-10 h-10 border-zinc-200"
                      disabled={isLoading}
                      maxLength={10}
                      {...register('mobile_number', {
                        onChange: (e) => {
                          e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)
                        }
                      })}
                    />
                  </div>
                  {errors.mobile_number && (
                    <p className="text-xs text-rose-600 mt-1">{errors.mobile_number.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referral_code" className="text-zinc-700 font-semibold">Referral Code (Optional)</Label>
                <Input
                  id="referral_code"
                  placeholder="Enter associate referral code if any"
                  className="h-10 border-zinc-200 focus-visible:ring-rose-500"
                  disabled={isLoading}
                  {...register('referral_code')}
                />
              </div>

              {/* Mobile OTP Code Input (only if regMethod is OTP) */}
              {regMethod === 'otp' && (
                <div className="border-t border-zinc-100 pt-4 mt-2 space-y-4">
                  {otpStep === 'request' ? (
                    <Button
                      type="button"
                      onClick={handleSendMobileOtp}
                      disabled={isLoading}
                      className="w-full bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 h-10 font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Phone className="h-4 w-4" />
                      Verify Phone via OTP Code
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="otp-token" className="text-zinc-700 font-bold">6-Digit Verification Code</Label>
                        <button type="button" onClick={() => setOtpStep('request')} className="text-xs text-rose-600 font-semibold hover:underline">
                          Resend Code
                        </button>
                      </div>
                      <Input
                        id="otp-token"
                        type="text"
                        maxLength={6}
                        placeholder="Enter 123456"
                        className="h-10 text-center font-bold tracking-widest text-lg border-rose-300 focus-visible:ring-rose-500"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                      />
                      <p className="text-[10px] text-zinc-400 text-center">SMS code sent to {otpSentMobile}. Enter 123456 to verify.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-zinc-100 mt-6">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-semibold"
                onClick={handleBack}
                disabled={isLoading}
              >
                Back
              </Button>
            )}

            {step === 1 ? (
              <Button
                type="button"
                className="flex-1 h-11 bg-pink-600 hover:bg-pink-700 text-white font-bold"
                onClick={handleNext}
              >
                Continue to Step 2
              </Button>
            ) : regMethod === 'email' ? (
              <Button
                type="submit"
                className="flex-1 h-11 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-bold shadow-md shadow-rose-200/50 hover:shadow-lg transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering Account...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleVerifyMobileOtp}
                className="flex-1 h-11 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-bold shadow-md shadow-rose-200/50 hover:shadow-lg transition-all duration-300"
                disabled={isLoading || otpStep === 'request'}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying OTP...
                  </>
                ) : (
                  'Verify OTP & Complete'
                )}
              </Button>
            )}
          </div>
        </form>

        {/* OAuth Divider */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-zinc-400 font-semibold">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full h-11 border border-zinc-200 hover:border-pink-600 hover:bg-pink-50/10 text-zinc-700 rounded-lg font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
              ) : (
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.483 0-6.312-2.829-6.312-6.313 0-3.483 2.829-6.312 6.312-6.312 1.624 0 3.098.618 4.223 1.628l2.915-2.916C18.428 2.228 15.534 1 12.24 1c-6.075 0-11 4.925-11 11s4.925 11 11 11c6.014 0 10.875-4.323 10.875-10.715 0-.585-.052-1.154-.15-1.71H12.24z"
                  />
                </svg>
              )}
              Google Registration
            </button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 text-center text-sm text-zinc-500 border-t border-zinc-100 pt-4">
        <p>
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-rose-600 hover:text-rose-500 hover:underline transition-all"
          >
            Sign in here
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
