'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Mail, Lock, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { loginSchema, type LoginInput } from '@/features/auth'
import { adminSignInAction } from '@/features/auth'

export default function AdminLoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Set mounted on client load
  useEffect(() => {
    setIsMounted(true)
  }, [])

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

  const onSubmit = async (data: LoginInput) => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await adminSignInAction(data)
      if (result?.error) {
        setError(result.error)
        toast.error('Authentication Failed', { description: result.error })
      } else if (result?.success && result.redirectUrl) {
        toast.success('Admin authorized successfully!', {
          description: 'Welcome to the operational command center.',
        })
        router.push(result.redirectUrl)
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isMounted) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden font-sans">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden font-sans">
      {/* Background gradients and neon blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-pink-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-rose-500/5 blur-[80px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />

      <div className="relative z-10 w-full max-w-md p-4 animate-in fade-in zoom-in-95 duration-500">
        <Card className="border-slate-800/80 bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-rose-950/20 text-slate-100">
          <CardHeader className="space-y-2 text-center pb-8 border-b border-slate-800/50">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/30 border border-pink-400/20 mb-2">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-pink-400 via-rose-300 to-pink-300 bg-clip-text text-transparent">
              RishtaJoro Operations
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Secure Staff & Admin Command Center Portal
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-8">
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/40 text-rose-300 text-xs flex items-start gap-2 border border-rose-900/50 animate-in fade-in slide-in-from-top-1">
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <p className="font-semibold">Access Denied</p>
                  <p className="text-rose-400/90">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 font-medium text-xs uppercase tracking-wider">
                  Staff Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@rishtajoro.com"
                    className="pl-10 h-10 bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-600 focus-visible:ring-pink-500 focus-visible:border-pink-500 focus-visible:ring-offset-0 focus-visible:ring-1 transition-all rounded-lg"
                    disabled={isLoading}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 font-medium text-xs uppercase tracking-wider">
                  Access Key
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-10 bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-600 focus-visible:ring-pink-500 focus-visible:border-pink-500 focus-visible:ring-offset-0 focus-visible:ring-1 transition-all rounded-lg"
                    disabled={isLoading}
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-semibold shadow-md shadow-pink-900/30 hover:shadow-lg transition-all duration-300 rounded-lg mt-2 cursor-pointer border-t border-white/10"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying Credentials...
                  </>
                ) : (
                  'Authorize Access'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
