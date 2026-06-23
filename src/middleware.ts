import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication
const AUTH_REQUIRED_ROUTES = [
  '/profile',
  '/matches',
  '/messages',
  '/settings',
  '/chat',
  '/dashboard',
  '/onboarding',
  '/interests',
  '/membership',
  '/support'
]

// Routes only accessible to guests (redirect authenticated users away)
const GUEST_ONLY_ROUTES = ['/login', '/register', '/forgot-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabaseResponse, supabase, user } = await updateSession(request)

  const isAuthenticated = !!user

  // Redirect authenticated users away from guest-only pages
  if (isAuthenticated && GUEST_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/profile', request.url))
  }

  // Protect auth-required routes
  if (!isAuthenticated && AUTH_REQUIRED_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DEACTIVATED ACCOUNT GUARD
  // If authenticated user is accessing any protected page, check is_deleted.
  // This ensures deactivated accounts are blocked everywhere, not just /chat.
  // ─────────────────────────────────────────────────────────────────────────
  const isImpersonating = request.cookies.has('impersonated_user_id')

  if (
    isAuthenticated &&
    !isImpersonating &&
    AUTH_REQUIRED_ROUTES.some((r) => pathname.startsWith(r)) &&
    pathname !== '/account-deleted'
  ) {
    try {
      const { data: profile } = await (supabase.from('profiles') as any)
        .select('is_deleted')
        .eq('id', user!.id)
        .single()

      if ((profile as any)?.is_deleted) {
        // Sign them out server-side so the session is fully cleared
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/account-deleted', request.url))
      }
    } catch {
      // If the profile query fails (e.g. table issue), allow through — don't break the app
    }
  }

  // Protect admin routes — role check is enforced server-side in layout
  if (!isAuthenticated && pathname.startsWith('/admin') && pathname !== '/admin/login') {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // Protect associate routes — role check is enforced server-side in layout
  if (!isAuthenticated && pathname.startsWith('/associate') && pathname !== '/associate/login') {
    return NextResponse.redirect(new URL('/associate/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

