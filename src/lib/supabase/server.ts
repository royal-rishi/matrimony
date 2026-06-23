import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Creates a Supabase client for use in Server Components,
 * Server Actions, and Route Handlers.
 * Uses the Next.js `cookies()` store to read/write session cookies.
 */
export async function createClient() {
  const cookieStore = await cookies()

  const client = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  // SECURE IMPERSONATION OVERRIDE
  const impersonatedUserId = cookieStore.get('impersonated_user_id')?.value
  if (impersonatedUserId) {
    try {
      // 1. Get the actual authenticated admin user
      const { data: { user: adminUser } } = await client.auth.getUser()
      if (adminUser) {
        // 2. Verify that this admin user is actually a staff admin
        const { data: profile } = await client
          .from('profiles')
          .select('role')
          .eq('id', adminUser.id)
          .single()

        if (profile && (profile.role === 'super_admin' || profile.role === 'admin')) {
          // Instantiate the service-role client (bypasses RLS)
          const adminClient = await createAdminClient()
          
          // Override getUser on this client to return the impersonated user's data
          adminClient.auth.getUser = async () => {
            const { data: userData } = await adminClient.auth.admin.getUserById(impersonatedUserId)
            if (userData && userData.user) {
              const impersonatedUser = {
                ...userData.user,
                user_metadata: {
                  ...userData.user.user_metadata,
                  is_impersonated: true,
                  admin_user_id: adminUser.id
                }
              }
              return { data: { user: impersonatedUser }, error: null }
            }
            return { data: { user: null }, error: new Error('Impersonated user not found') }
          }

          return adminClient as any
        }
      }
    } catch (e) {
      console.error('Error establishing impersonated session client:', e)
    }
  }

  return client
}

/**
 * Creates a Supabase admin client using the service role key.
 * WARNING: Only use in trusted server-side code (Route Handlers, Server Actions).
 * NEVER expose this client or the SERVICE_ROLE_KEY to the browser.
 */
export async function createAdminClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
