'use server'

import { getAdminSession, logAdminActivity } from './helper'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function impersonateUserAction(userId: string) {
  try {
    // 1. Authenticate caller and assert they are indeed a staff admin
    const { supabase, user: adminUser } = await getAdminSession()

    // 2. Fetch the target user details to log it and verify profile exists
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, role')
      .eq('id', userId)
      .single()

    if (profileError || !targetProfile) {
      throw new Error('Target profile not found')
    }

    if (targetProfile.role === 'super_admin') {
      throw new Error('Cannot impersonate another Super Admin account.')
    }

    // 3. Log the impersonation action in audit trail
    await logAdminActivity(
      supabase,
      adminUser.id,
      `Impersonation Started: ${targetProfile.first_name} ${targetProfile.last_name} (${userId})`,
      'profiles',
      userId,
      {},
      {}
    )

    // 4. Set impersonated user cookie
    const cookieStore = await cookies()
    cookieStore.set('impersonated_user_id', userId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 hours session bounds
    })

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function stopImpersonatingAction() {
  try {
    const cookieStore = await cookies()
    const impersonatedId = cookieStore.get('impersonated_user_id')?.value

    if (impersonatedId) {
      const supabase = (await import('@/lib/supabase/server')).createClient()
      const client = await supabase
      const { data: { user: adminUser } } = await client.auth.getUser()

      if (adminUser) {
        await logAdminActivity(
          client,
          adminUser.id,
          'Impersonation Ended',
          'profiles',
          impersonatedId,
          {},
          {}
        )
      }
    }

    cookieStore.delete('impersonated_user_id')
    revalidatePath('/')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
