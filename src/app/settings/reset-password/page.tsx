import { ResetPasswordForm } from '@/features/auth'
import { generateMetadata } from '@/lib/seo/metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Reset Password',
  description: 'Enter your new password to reset your account credentials.',
  path: '/settings/reset-password',
  noIndex: true,
})

/**
 * Page that allows logged-in users (usually redirected here via a reset password callback)
 * to set a new password.
 */
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full flex justify-center">
        <ResetPasswordForm />
      </div>
    </div>
  )
}
