/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800/80 pt-16 pb-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Logo and Tagline Column */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="inline-flex items-center group">
              <img
                src="/images/logo.png"
                alt="RishtaJoro Matrimonial"
                className="h-[54px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.01]"
              />
            </Link>

            <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed max-w-sm">
              RishtaJoro is India&apos;s premium matrimonial service combining modern technology with human matchmaking. We help you find your lifemate securely, maintaining traditional family values.
            </p>

            {/* Social Icons */}
            <div className="flex gap-4">
              <Link href="#" className="h-8 w-8 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-pink-600 hover:border-pink-600 transition-colors shadow-sm" aria-label="Facebook">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                </svg>
              </Link>
              <Link href="#" className="h-8 w-8 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-pink-600 hover:border-pink-600 transition-colors shadow-sm" aria-label="Twitter">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </Link>
              <Link href="#" className="h-8 w-8 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-pink-600 hover:border-pink-600 transition-colors shadow-sm" aria-label="Instagram">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204 0-3.204 0-3.204z M12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324z"/>
                </svg>
              </Link>
              <Link href="#" className="h-8 w-8 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-pink-600 hover:border-pink-600 transition-colors shadow-sm" aria-label="LinkedIn">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-[#3c0f20] dark:text-white text-xs uppercase tracking-wider font-serif">
              Matchmaking
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/search" className="text-zinc-500 dark:text-zinc-400 hover:text-pink-600 transition-colors">
                  AI Recommendations
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-zinc-500 dark:text-zinc-400 hover:text-pink-600 transition-colors">
                  Human Assisted Plans
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-zinc-500 dark:text-zinc-400 hover:text-pink-600 transition-colors">
                  KYC Verification
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-zinc-500 dark:text-zinc-400 hover:text-pink-600 transition-colors">
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-[#3c0f20] dark:text-white text-xs uppercase tracking-wider font-serif">
              Company
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="#" className="text-zinc-500 dark:text-zinc-400 hover:text-pink-600 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-zinc-500 dark:text-zinc-400 hover:text-pink-600 transition-colors">
                  Premium Membership
                </Link>
              </li>
              <li>
                <Link href="#" className="text-zinc-500 dark:text-zinc-400 hover:text-pink-600 transition-colors">
                  Matrimonial Safety
                </Link>
              </li>
              <li>
                <Link href="/associate/login" className="text-zinc-500 dark:text-zinc-400 hover:text-pink-600 transition-colors">
                  Local Associate Careers
                </Link>
              </li>
              <li>
                <Link href="/associate/register" className="text-zinc-500 dark:text-zinc-400 hover:text-pink-600 transition-colors">
                  Become a Associate
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support Column */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-[#3c0f20] dark:text-white text-xs uppercase tracking-wider font-serif">
              Get in Touch
            </h4>
            <ul className="space-y-3 text-xs text-zinc-500 dark:text-zinc-400">
              <li className="flex items-start gap-2.5">
                <Mail className="h-4.5 w-4.5 text-pink-600 shrink-0 mt-0.5" />
                <a href="mailto:rishtajodomatrimony@gmail.com" className="hover:text-pink-600 transition-colors">
                  rishtajodomatrimony@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="h-4.5 w-4.5 text-pink-600 shrink-0 mt-0.5" />
                <a href="tel:+918340465337" className="hover:text-pink-600 transition-colors">
                  +91 8340465337
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4.5 w-4.5 text-pink-600 shrink-0 mt-0.5" />
                <span>
                  Pakthaul chowk, Barauni , Begusarai, Bihar 851115, india
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-zinc-200 dark:border-zinc-800/60 pt-8 flex flex-col md:flex-row md:justify-between items-center gap-4 text-[10px] text-zinc-400">
          <p>© {currentYear} RishtaJoro Matrimonial. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-pink-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-pink-600 transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-pink-600 transition-colors">
              Cookie Preferences
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
