import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * API route handler that exchanges a Supabase auth code for a session cookie.
 * This is triggered by clicking confirmation links in signup or reset password emails.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Auto-reactivate user profile if deactivated
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await (supabase
            .from('profiles')
            .select('is_deleted')
            .eq('id', user.id)
            .single() as any)

          if (profile?.is_deleted) {
            await (supabase.from('profiles') as any)
              .update({ is_deleted: false, deleted_at: null })
              .eq('id', user.id)
          }
        }
      } catch (e) {
        console.error('Error during auto-reactivation in callback:', e)
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // Safe hosting on Vercel
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Redirect to login with error details if code exchange fails
  return NextResponse.redirect(`${origin}/login?error=Could not exchange auth code for session`)
}
