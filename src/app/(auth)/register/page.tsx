import { generateMetadata } from '@/lib/seo/metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Create Account',
  description: 'Join Rishtajodo Matrimony and find your perfect life partner.',
  path: '/register',
  noIndex: true,
})

import { RegisterForm } from '@/features/auth'

export default function RegisterPage() {
  return <RegisterForm />
}
