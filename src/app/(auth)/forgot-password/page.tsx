import { generateMetadata } from '@/lib/seo/metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Forgot Password',
  path: '/forgot-password',
  noIndex: true,
})

import { ForgotPasswordForm } from '@/features/auth'

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
