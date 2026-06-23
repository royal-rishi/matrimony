import { generateMetadata } from '@/lib/seo/metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Sign In',
  description: 'Sign in to your Rishtajodo Matrimony account.',
  path: '/login',
  noIndex: true,
})

import { LoginForm } from '@/features/auth'
import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-zinc-500 text-sm animate-pulse">Loading login form...</div>}>
      <LoginForm />
    </Suspense>
  )
}
