'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Mail, Lock, AlertCircle, CheckCircle, KeyRound } from 'lucide-react'

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

  // OTP Login Flow States
  const [otpIdentifier, setOtpIdentifier] = useState('')
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request')
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

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
      const result = await sendOtpAction(data)
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
            : 'Please check the email registered to your mobile number for the 6-digit login token.',
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
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-10 border-zinc-200 focus-visible:ring-rose-500 focus-visible:border-rose-500 transition-all"
                    disabled={isLoading}
                    {...register('password')}
                  />
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
                      {...otpRequestForm.register('identifier')}
                    />
                  </div>
                  {otpRequestForm.formState.errors.identifier && (
                    <p className="text-xs text-rose-600 mt-1">{otpRequestForm.formState.errors.identifier.message}</p>
                  )}
                </div>

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
