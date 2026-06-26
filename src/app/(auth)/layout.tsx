import { LandingHeader } from '@/features/landing/components/landing-header'
import React from 'react'

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
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <LandingHeader />
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-50 dark:from-zinc-900 dark:to-zinc-800 p-4">
        <div className="w-full flex justify-center py-8">
          {children}
        </div>
      </div>
    </div>
  )
}
