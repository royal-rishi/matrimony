'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Mail, Lock, AlertCircle, CheckCircle, KeyRound, MessageSquare, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { 
  loginSchema, 
  otpRequestSchema, 
  otpVerifySchema, 
  type LoginInput,
  type OtpRequestInput,
  type OtpVerifyInput
} from '../validators/auth-validators'
import { signInAction, sendOtpAction, verifyOtpAction } from '../actions/auth-actions'

export function LoginForm() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // OTP Login Flow States
  const [otpIdentifier, setOtpIdentifier] = useState('')
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request')
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [otpChannel, setOtpChannel] = useState<'sms' | 'whatsapp'>('sms')

  // Message flags from query parameters
  const isRegistered = searchParams.get('registered') === 'true'
  const isResetSuccess = searchParams.get('reset_success') === 'true'
  const oauthError = searchParams.get('error')

  // Hook form for Email/Password
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Hook form for OTP Request
  const otpRequestForm = useForm<OtpRequestInput>({
    resolver: zodResolver(otpRequestSchema),
    defaultValues: {
      identifier: '',
    },
  })

  // Hook form for OTP Verify
  const otpVerifyForm = useForm<OtpVerifyInput>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: {
      identifier: '',
      token: '',
    },
  })

  const identifierValue = otpRequestForm.watch('identifier') || ''
  const isPhoneNumber = /^\d+$/.test(identifierValue) || (identifierValue.length >= 10 && !identifierValue.includes('@'))

  useEffect(() => {
    if (isRegistered) {
      toast.success('Registration successful!', {
        description: 'Please log in to your account.',
      })
    }
    if (isResetSuccess) {
      toast.success('Password reset complete!', {
        description: 'You can now log in with your new password.',
      })
    }
    if (oauthError) {
      setError(oauthError)
    }
  }, [isRegistered, isResetSuccess, oauthError])

  // Email + Password Sign In Handler
  const onSubmit = async (data: LoginInput) => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await signInAction(data)
      if (result?.error) {
        setError(result.error)
      } else {
        toast.success('Signed in successfully!')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Request OTP Handler
  const onOtpRequest = async (data: OtpRequestInput) => {
    setError(null)
    setIsSendingOtp(true)

    try {
      const result = await sendOtpAction({
        ...data,
        channel: isPhoneNumber ? otpChannel : undefined
      })
      if (result?.error) {
        setError(result.error)
      } else {
        setOtpIdentifier(data.identifier)
        otpVerifyForm.setValue('identifier', data.identifier)
        setOtpStep('verify')
        const isEmail = data.identifier.includes('@')
        toast.success('OTP code sent successfully!', {
          description: isEmail
            ? 'Please check your registered email for the 6-digit login token.'
            : `Please check your phone for the 6-digit verification code sent via ${otpChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'}.`,
        })
      }
    } catch {
      setError('Failed to send OTP code. Please try again.')
    } finally {
      setIsSendingOtp(false)
    }
  }

  // Verify OTP Handler
  const onOtpVerify = async (data: OtpVerifyInput) => {
    setError(null)
    setIsVerifyingOtp(true)

    try {
      const result = await verifyOtpAction(data)
      if (result?.error) {
        setError(result.error)
      } else {
        toast.success('Signed in successfully!')
      }
    } catch {
      setError('Invalid or expired OTP token. Please try again.')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  // Google OAuth Handler
  const handleGoogleSignIn = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
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
    <Card className="w-full max-w-md border-zinc-200/50 shadow-xl shadow-zinc-100/50 bg-white/80 backdrop-blur-md transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-zinc-500">
          Sign in to Rishtajodo matrimony network
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Verification Status Alerts */}
        {isRegistered && !error && (
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm flex items-start gap-2 border border-emerald-100">
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
            <div>
              <p className="font-semibold">Registration Complete</p>
              <p className="text-xs text-emerald-600">Please sign in with your email and password.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm flex items-start gap-2 border border-rose-100 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication Error</p>
              <p className="text-xs text-rose-600">{error}</p>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-6">
            <TabsTrigger value="password" className="text-xs font-semibold py-2">Password Login</TabsTrigger>
            <TabsTrigger value="otp" className="text-xs font-semibold py-2">OTP Login</TabsTrigger>
          </TabsList>

          {/* Email + Password Form */}
          <TabsContent value="password">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-700 font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10 h-10 border-zinc-200 focus-visible:ring-rose-500 focus-visible:border-rose-500 transition-all"
                    disabled={isLoading}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-zinc-700 font-medium">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-rose-600 hover:text-rose-500 hover:underline transition-all"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-10 border-zinc-200 focus-visible:ring-rose-500 focus-visible:border-rose-500 transition-all"
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

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-medium shadow-md shadow-rose-200/50 hover:shadow-lg transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </TabsContent>

          {/* OTP Onboarding Flow */}
          <TabsContent value="otp">
            {otpStep === 'request' ? (
              <form onSubmit={otpRequestForm.handleSubmit(onOtpRequest)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp-identifier" className="text-zinc-700 font-medium">Email or Mobile Number</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <Input
                      id="otp-identifier"
                      type="text"
                      placeholder="name@example.com or 0123456789"
                      className="pl-10 h-10 border-zinc-200 focus-visible:ring-rose-500 focus-visible:border-rose-500 transition-all"
                      disabled={isSendingOtp}
                      {...otpRequestForm.register('identifier', {
                        onChange: (e) => {
                          const val = e.target.value
                          if (/^\d+/.test(val)) {
                            e.target.value = val.replace(/\D/g, '').slice(0, 10)
                          }
                        }
                      })}
                    />
                  </div>
                  {otpRequestForm.formState.errors.identifier && (
                    <p className="text-xs text-rose-600 mt-1">{otpRequestForm.formState.errors.identifier.message}</p>
                  )}
                </div>

                {isPhoneNumber && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <Label className="text-zinc-700 font-medium">OTP Delivery Channel</Label>
                    <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setOtpChannel('sms')}
                        className={`py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${
                          otpChannel === 'sms'
                            ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50'
                            : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
                        SMS
                      </button>
                      <button
                        type="button"
                        onClick={() => setOtpChannel('whatsapp')}
                        className={`py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-all ${
                          otpChannel === 'whatsapp'
                            ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50'
                            : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                      >
                        <svg className="h-3.5 w-3.5 fill-emerald-600" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.118-2.905-6.993-1.876-1.875-4.357-2.905-6.99-2.906-5.437 0-9.865 4.421-9.87 9.867-.002 1.714.453 3.39 1.317 4.877L1.13 22.84l4.521-1.186zM17.47 14.397c-.3-.149-1.777-.877-2.031-.97-.254-.092-.44-.139-.625.139-.185.277-.714.877-.875 1.062-.162.185-.325.208-.625.059-1.05-.523-1.815-.967-2.529-1.68-1.07-1.074-1.503-1.928-1.636-2.113-.13-.185-.014-.285.136-.434.135-.134.3-.348.45-.522.15-.174.2-.298.3-.497.1-.198.05-.371-.025-.521-.075-.149-.625-1.503-.856-2.062-.224-.539-.452-.465-.625-.473-.162-.008-.348-.009-.535-.009-.187 0-.491.07-.749.348-.257.278-.985.962-.985 2.348 0 1.387 1.008 2.725 1.15 2.91 1.03 1.365 2.164 2.215 3.328 2.659.83.316 1.59.339 2.189.251.667-.098 1.777-.726 2.027-1.428.25-.702.25-1.303.175-1.428-.075-.126-.275-.202-.575-.351z"/>
                        </svg>
                        WhatsApp
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-medium shadow-md shadow-rose-200/50 hover:shadow-lg transition-all duration-300"
                  disabled={isSendingOtp}
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send OTP Code'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={otpVerifyForm.handleSubmit(onOtpVerify)} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="verify-token" className="text-zinc-700 font-medium">Enter 6-digit Code</Label>
                    <button
                      type="button"
                      onClick={() => setOtpStep('request')}
                      className="text-xs text-rose-600 hover:text-rose-500 hover:underline"
                    >
                      Change Email/Phone
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <Input
                      id="verify-token"
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      className="pl-10 h-10 border-zinc-200 focus-visible:ring-rose-500 focus-visible:border-rose-500 transition-all tracking-widest text-center font-bold text-lg"
                      disabled={isVerifyingOtp}
                      {...otpVerifyForm.register('token')}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400">Sent to: <span className="font-bold text-zinc-600">{otpIdentifier}</span></p>
                  {otpVerifyForm.formState.errors.token && (
                    <p className="text-xs text-rose-600 mt-1">{otpVerifyForm.formState.errors.token.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-medium shadow-md shadow-rose-200/50 hover:shadow-lg transition-all duration-300"
                  disabled={isVerifyingOtp}
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Sign In'
                  )}
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>

        {/* Separator / Social Login */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-zinc-400 font-medium">Or continue with</span>
          </div>
        </div>

        {/* Google OAuth Login Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full h-11 border border-zinc-200 hover:border-pink-600 hover:bg-pink-50/20 text-zinc-700 rounded-lg font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 shadow-sm"
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
          Google Login
        </button>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 text-center text-sm text-zinc-500 border-t border-zinc-100 pt-4">
        <p>
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold text-rose-600 hover:text-rose-500 hover:underline transition-all"
          >
            Register free
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
