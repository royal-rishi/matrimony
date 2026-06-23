'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Loader2, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { forgotPasswordSchema, type ForgotPasswordInput } from '../validators/auth-validators'
import { forgotPasswordAction } from '../actions/auth-actions'

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    try {
      const result = await forgotPasswordAction(data)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md border-zinc-200/50 shadow-xl shadow-zinc-100/50 bg-white/80 backdrop-blur-md transition-all duration-300 hover:shadow-2xl">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
          Reset Password
        </CardTitle>
        <CardDescription className="text-zinc-500">
          We will send you a password reset link to your registered email
        </CardDescription>
      </CardHeader>

      <CardContent>
        {success ? (
          <div className="text-center py-6 space-y-4 animate-in fade-in duration-300">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-zinc-900">Check Your Email</h3>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                We have sent a secure password reset link to your email address. Please check your inbox (and spam folder).
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-in fade-in duration-300">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm flex items-start gap-2 border border-rose-100">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
                <div>
                  <p className="font-semibold">Reset Failed</p>
                  <p className="text-xs text-rose-600">{error}</p>
                </div>
              </div>
            )}

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

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-medium shadow-md shadow-rose-200/50 hover:shadow-lg transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-center text-sm border-t border-zinc-100 pt-4">
        <Link
          href="/login"
          className="inline-flex items-center text-zinc-500 hover:text-rose-600 font-medium transition-all gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>
      </CardFooter>
    </Card>
  )
}
