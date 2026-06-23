import { createClient } from '@/lib/supabase/server'

/**
 * Validates the admin staff session and checks for the required permission.
 * Bypasses checks if the user is a super_admin.
 */
export async function getAdminSession(requiredPermission?: string) {
  const supabase = (await createClient()) as any
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized: No active admin session found')
  }

  // 1. Fetch user profile role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, first_name, last_name')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Unauthorized: Profile not found')
  }

  // 2. Super admin gets immediate full access
  if (profile.role === 'super_admin') {
    return { supabase, user, profile, roleId: 'super_admin', permissions: ['*'] }
  }

  // 3. Fetch detailed admin profile & role permissions
  const { data: adminProfile, error: adminProfileError } = await supabase
    .from('admin_profiles')
    .select(`
      *,
      role:admin_roles(permissions)
    `)
    .eq('id', user.id)
    .eq('status', 'active')
    .single()

  if (adminProfileError || !adminProfile) {
    throw new Error('Unauthorized: Insufficient staff privileges or account suspended')
  }

  const permissions = (adminProfile.role?.permissions as string[]) || []

  // 4. Assert permission coverage
  if (requiredPermission && !permissions.includes(requiredPermission)) {
    throw new Error(`Forbidden: Missing required permission [${requiredPermission}]`)
  }

  return {
    supabase,
    user,
    profile,
    roleId: adminProfile.role_id,
    permissions,
    assignedDepartments: adminProfile.assigned_departments || [],
  }
}

/**
 * Utility to log audit events into database.
 */
export async function logAdminActivity(
  supabase: any,
  adminId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  oldData: Record<string, any> = {},
  newData: Record<string, any> = {}
) {
  try {
    await supabase.from('admin_activity_logs').insert({
      admin_id: adminId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_data: oldData,
      new_data: newData,
    })
  } catch (e) {
    console.error('Audit logging failed:', e)
  }
}
