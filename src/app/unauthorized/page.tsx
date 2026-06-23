import Link from 'next/link'
import { generateMetadata } from '@/lib/seo/metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Access Denied',
  noIndex: true,
})

/**
 * Unauthorized page — shown when a user accesses a route their role does not permit.
 */
export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <p className="text-8xl font-black text-pink-600 mb-4">403</p>
      <h1 className="text-3xl font-bold mb-3">Access Denied</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        You do not have permission to view this page. Please contact your administrator if you believe this is a mistake.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
      >
        Go Back Home
      </Link>
    </div>
  )
}
