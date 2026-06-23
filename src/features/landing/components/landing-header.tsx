'use client'
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Heart, Menu, User, LogIn } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const guestLinks = [
  { href: '/', label: 'Home' },
  { href: '/search', label: 'Search' },
  { href: '/#pricing', label: 'Membership' },
  { href: '/#success-stories', label: 'Success Stories' },
  { href: '/#cta-contact', label: 'Contact Us' },
]

const memberLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/matches', label: 'Matches' },
  { href: '/interests', label: 'Interests' },
  { href: '/chat', label: 'Chat' },
  { href: '/membership', label: 'Membership Center' },
  { href: '/settings', label: 'Settings' },
  { href: '/support', label: 'Support Center' },
]

export function LandingHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const currentLinks = isAuthenticated ? memberLinks : guestLinks

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 bg-white/85 backdrop-blur-md dark:bg-zinc-950/85 dark:border-zinc-800/50 transition-all duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo - mockup png */}
        <Link href="/" className="flex items-center group">
          <img
            src="/images/logo.png"
            alt="Rishtajodo Matrimonial"
            className="h-[48px] md:h-[54px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.01]"
          />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          {currentLinks.map((link) => {
            const isActive = link.href === '/' ? pathname === '/' : pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-semibold transition-colors duration-200 relative py-1.5",
                  isActive
                    ? "text-pink-600 dark:text-pink-400 after:absolute after:bottom-[-2px] after:left-0 after:h-[3px] after:w-full after:bg-pink-600 after:rounded-full"
                    : "text-zinc-700 hover:text-pink-600 dark:text-zinc-300 dark:hover:text-pink-400 after:absolute after:bottom-[-2px] after:left-0 after:h-[3px] after:w-0 after:bg-pink-600 after:transition-all hover:after:w-full after:rounded-full"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated === true ? (
            <>
              <Link
                href="/profile"
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  "border-pink-200 text-pink-600 hover:bg-pink-50 hover:text-pink-700 font-semibold shadow-sm flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg"
                )}
              >
                <Heart className="h-4 w-4 fill-pink-600 text-pink-600" />
                My Profile
              </Link>
              <Button
                variant="ghost"
                onClick={async () => {
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  router.push('/')
                  router.refresh()
                }}
                className="text-zinc-500 hover:text-pink-600 hover:bg-pink-50 font-semibold"
              >
                Sign Out
              </Button>
            </>
          ) : isAuthenticated === false ? (
            <>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  "border-pink-600 text-pink-600 hover:bg-pink-50 hover:text-pink-700 font-semibold flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-white"
                )}
              >
                <LogIn className="h-4 w-4 text-pink-600" />
                Login
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  "bg-pink-600 hover:bg-pink-750 text-white font-semibold flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg"
                )}
              >
                <User className="h-4 w-4 text-white" />
                Register Free
              </Link>
            </>
          ) : (
            <div className="w-24 h-10 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
            </div>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="text-zinc-700" />
              }
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] p-6 bg-white dark:bg-zinc-950">
              <div className="flex flex-col gap-6 h-full justify-between">
                <div className="space-y-6">
                  {/* Brand logo in sheet */}
                  <div className="flex items-center border-b border-zinc-100 pb-4">
                    <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center">
                      <img
                        src="/images/logo.png"
                        alt="Rishtajodo Matrimonial"
                        className="h-[40px] w-auto object-contain"
                      />
                    </Link>
                  </div>

                  {/* Navigation Links inside Mobile Drawer */}
                  <nav className="flex flex-col gap-4">
                    {currentLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="text-base font-semibold text-zinc-700 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50/50 transition-all"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex flex-col gap-3 border-t border-zinc-100 pt-6">
                  {isAuthenticated === true ? (
                    <>
                      <Link
                        href="/profile"
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          buttonVariants({ variant: 'default' }),
                          "w-full h-11 bg-gradient-to-r from-pink-600 to-rose-500 text-white hover:text-white font-medium flex items-center justify-center gap-1.5"
                        )}
                      >
                        <Heart className="h-4 w-4 fill-white" />
                        My Profile
                      </Link>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          setIsOpen(false)
                          const supabase = createClient()
                          await supabase.auth.signOut()
                          router.push('/')
                          router.refresh()
                        }}
                        className="w-full h-11 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                      >
                        Sign Out
                      </Button>
                    </>
                  ) : isAuthenticated === false ? (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          buttonVariants({ variant: 'outline' }),
                          "w-full h-11 border-zinc-200 text-zinc-700 hover:bg-zinc-50 flex items-center justify-center"
                        )}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          buttonVariants({ variant: 'default' }),
                          "w-full h-11 bg-gradient-to-r from-pink-600 to-rose-500 text-white hover:text-white font-medium flex items-center justify-center"
                        )}
                      >
                        Register Free
                      </Link>
                    </>
                  ) : (
                    <div className="h-24 flex items-center justify-center">
                      <div className="h-5 w-5 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

