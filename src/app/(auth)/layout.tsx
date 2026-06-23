/**
 * Auth route group layout.
 * Wraps login, register, forgot-password, and reset-password pages.
 * Provides a centered, card-based layout optimized for authentication forms.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full flex justify-center">
        {children}
      </div>
    </div>
  )
}
