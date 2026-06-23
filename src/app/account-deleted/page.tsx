import Link from 'next/link'
import Image from 'next/image'
import { UserX, LogIn, RefreshCw, HeartHandshake } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Account Deactivated | RishtaJodo Matrimony',
  description: 'Your RishtaJodo profile is currently deactivated.',
}

export default function AccountDeletedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF7FA] to-pink-50 flex flex-col items-center justify-center px-4 font-sans">
      {/* Logo */}
      <div className="mb-8">
        <Image
          src="/logo/logo.png"
          alt="RishtaJodo Matrimony"
          width={160}
          height={48}
          className="object-contain"
          priority
        />
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-2xl border border-zinc-100 p-8 max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center border-4 border-rose-200">
          <UserX className="h-10 w-10 text-rose-500" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
            Account Deactivated
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Your profile has been deactivated and is hidden from all searches and matches. Your data is safely preserved.
          </p>
        </div>

        {/* Info box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-2">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">While deactivated:</p>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>• Your profile is invisible to other members</li>
            <li>• You cannot send or receive match interests</li>
            <li>• Chat rooms are paused</li>
            <li>• All your data and photos are safely stored</li>
          </ul>
        </div>

        {/* Reactivation info */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-left">
          <RefreshCw className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-emerald-700">Want to come back?</p>
            <p className="text-xs text-emerald-600 mt-0.5 leading-relaxed">
              Simply log in with your account below — your profile will be automatically reactivated and restored.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/login">
            <Button className="w-full h-12 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-bold rounded-xl text-sm shadow-md">
              <LogIn className="h-4 w-4 mr-2" />
              Log In to Reactivate Account
            </Button>
          </Link>

          <Link href="/">
            <Button
              variant="outline"
              className="w-full h-11 border-zinc-200 text-zinc-600 font-semibold rounded-xl text-sm hover:bg-zinc-50"
            >
              <HeartHandshake className="h-4 w-4 mr-2" />
              Return to Homepage
            </Button>
          </Link>
        </div>

        {/* Footer note */}
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          If you wish to permanently delete your account and all data, please{' '}
          <Link href="/support" className="text-pink-600 font-semibold hover:underline">
            contact support
          </Link>.
        </p>
      </div>

      <p className="mt-6 text-xs text-zinc-400">
        © {new Date().getFullYear()} RishtaJodo Matrimony · All rights reserved
      </p>
    </div>
  )
}

