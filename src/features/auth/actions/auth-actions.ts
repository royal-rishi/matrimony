'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/types/database'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  otpRequestSchema,
  otpVerifySchema,
  associateRegisterSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type OtpRequestInput,
  type OtpVerifyInput,
  type AssociateRegisterInput,
} from '../validators/auth-validators'

/**
 * Server Action to log in an existing user.
 */
export async function signInAction(rawInput: LoginInput) {
  const validatedFields = loginSchema.safeParse(rawInput)
  if (!validatedFields.success) {
    return { error: 'Invalid email or password' }
  }

  const { email, password } = validatedFields.data
  const supabase = await createClient()

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !signInData?.user) {
    return { error: error?.message || 'Failed to authenticate user.' }
  }

  // Get the profile to determine redirection route based on user role and profile completeness
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, education, photos, is_deleted')
    .eq('id', signInData.user.id)
    .single() as unknown as { data: { role: UserRole; education: string | null; photos: string[]; is_deleted: boolean } | null; error: Error | null }

  if (profileError || !profile) {
    redirect('/')
  }

  // Auto-reactivate: if the user had deactivated their account and is now logging back in,
  // restore their profile automatically — this is their intent signal to come back.
  if (profile.is_deleted) {
    await (supabase.from('profiles') as any)
      .update({ is_deleted: false, deleted_at: null })
      .eq('id', signInData.user.id)
    // Fall through to normal redirect below
  }

  if (profile.role === 'super_admin') {
    redirect('/admin')
  } else if (
    ['local_associate', 'block_associate', 'district_associate', 'state_associate'].includes(
      profile.role
    )
  ) {
    redirect('/associate')
  } else {
    const hasPhotos = profile.photos && profile.photos.length > 0
    const hasEducation = !!profile.education
    if (!hasEducation || !hasPhotos) {
      redirect('/onboarding')
    } else {
      redirect('/dashboard')
    }
  }
}


/**
 * Server Action to sign up a new matrimonial user.
 * Sends registration meta-data that populates profiles table automatically via DB trigger.
 */
export async function signUpAction(rawInput: RegisterInput) {
  const validatedFields = registerSchema.safeParse(rawInput)
  if (!validatedFields.success) {
    return { error: 'Please correct the validation errors and try again.' }
  }

  const supabase = await createClient()
  const {
    email,
    password,
    first_name,
    last_name,
    gender,
    date_of_birth,
    religion,
    mobile_number,
    referral_code,
  } = validatedFields.data

  const adminSupabase = await createAdminClient()

  // ── Check 1: Email duplicate ─────────────────────────────────────────────
  // Skip this check for mobile-OTP mock emails (mobile_XXXXX@rishtajodo.com)
  const isMockEmail = email.includes('@rishtajodo.com') && email.startsWith('mobile_')
  if (!isMockEmail) {
    const { data: existingAuthUsers } = await adminSupabase.auth.admin.listUsers()
    const emailAlreadyExists = existingAuthUsers?.users?.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    )
    if (emailAlreadyExists) {
      return { error: 'This email address is already registered. Please log in or use a different email.' }
    }
  }

  // ── Check 2: Mobile number duplicate ────────────────────────────────────
  if (mobile_number) {
    const cleanMobile = mobile_number.replace(/\D/g, '')
    const { data: existingMobile } = await (adminSupabase.from('profiles') as any)
      .select('id')
      .or(`mobile_number.eq.${cleanMobile},mobile_number.eq.+91${cleanMobile},mobile_number.eq.91${cleanMobile}`)
      .maybeSingle()

    if (existingMobile) {
      return { error: 'This mobile number is already linked to an account. Please log in or use a different number.' }
    }
  }

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name,
        last_name,
        gender,
        date_of_birth,
        religion,
        mobile_number,
        role: 'user', // standard user signup is always 'user'
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`,
    },
  })

  if (error) {
    // Provide friendly error messages for common Supabase auth errors
    if (error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('already been registered')) {
      return { error: 'This email address is already registered. Please log in or use a different email.' }
    }
    return { error: error.message }
  }

  if (signUpData?.user) {
    try {
      await (adminSupabase.from('profiles') as any)
        .update({
          mobile_number,
          referral_code: referral_code || null,
        })
        .eq('id', signUpData.user.id)
    } catch (dbErr) {
      console.error('Failed to update profile fields during signup:', dbErr)
    }
  }

  redirect('/login?registered=true')
}


/**
 * Server Action to sign out the current user.
 */
export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Server Action to check if a mobile number is already registered.
 * Used in registration form to show early duplicate error before OTP.
 */
export async function checkMobileExistsAction(mobileNumber: string) {
  try {
    const adminSupabase = await createAdminClient()
    const cleanMobile = mobileNumber.replace(/\D/g, '')
    const { data } = await (adminSupabase.from('profiles') as any)
      .select('id')
      .or(`mobile_number.eq.${cleanMobile},mobile_number.eq.+91${cleanMobile},mobile_number.eq.91${cleanMobile}`)
      .maybeSingle()
    return { exists: !!data }
  } catch {
    return { exists: false }
  }
}


/**
 * Server Action to request a password reset email.
 */
export async function forgotPasswordAction(rawInput: ForgotPasswordInput) {
  const validatedFields = forgotPasswordSchema.safeParse(rawInput)
  if (!validatedFields.success) {
    return { error: 'Invalid email address' }
  }

  const { email } = validatedFields.data
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback?next=/settings/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

/**
 * Server Action to update password for current authenticated session.
 */
export async function resetPasswordAction(rawInput: ResetPasswordInput) {
  const validatedFields = resetPasswordSchema.safeParse(rawInput)
  if (!validatedFields.success) {
    return { error: 'Invalid passwords' }
  }

  const { password } = validatedFields.data
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/login?reset_success=true')
}

/**
 * Server Action to request an email OTP login code.
 */
export async function sendOtpAction(rawInput: OtpRequestInput) {
  const validatedFields = otpRequestSchema.safeParse(rawInput)
  if (!validatedFields.success) {
    return { error: 'Invalid email address or mobile number' }
  }

  const { identifier } = validatedFields.data
  const supabase = await createClient()
  
  let email = ''

  if (identifier.includes('@')) {
    email = identifier
  } else {
    // Look up mobile number in profiles table
    const cleanPhone = identifier.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      return { error: 'Please enter a valid 10-digit mobile number.' }
    }
    
    const adminSupabase = await createAdminClient()
    const { data: profile, error: profileErr } = await (adminSupabase.from('profiles') as any)
      .select('id')
      .or(`mobile_number.eq.${cleanPhone},mobile_number.like.%${cleanPhone}`)
      .eq('is_deleted', false)
      .maybeSingle()

    if (profileErr || !profile) {
      return { error: 'No account found with this mobile number.' }
    }

    // Get registered email from auth.users using admin client
    const { data: authUser, error: authUserErr } = await adminSupabase.auth.admin.getUserById(profile.id)
    if (authUserErr || !authUser?.user?.email) {
      return { error: 'Could not retrieve registered email for this mobile number.' }
    }

    email = authUser.user.email
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // OTP is for logging in existing users only
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

/**
 * Server Action to verify OTP login code.
 */
export async function verifyOtpAction(rawInput: OtpVerifyInput) {
  const validatedFields = otpVerifySchema.safeParse(rawInput)
  if (!validatedFields.success) {
    return { error: 'Invalid email/phone or verification code' }
  }

  const { identifier, token } = validatedFields.data
  const supabase = await createClient()

  let email = ''

  if (identifier.includes('@')) {
    email = identifier
  } else {
    // Look up mobile number in profiles table
    const cleanPhone = identifier.replace(/\D/g, '')
    const adminSupabase = await createAdminClient()
    const { data: profile, error: profileErr } = await (adminSupabase.from('profiles') as any)
      .select('id')
      .or(`mobile_number.eq.${cleanPhone},mobile_number.like.%${cleanPhone}`)
      .eq('is_deleted', false)
      .maybeSingle()

    if (profileErr || !profile) {
      return { error: 'No account found with this mobile number.' }
    }

    // Get registered email from auth.users using admin client
    const { data: authUser, error: authUserErr } = await adminSupabase.auth.admin.getUserById(profile.id)
    if (authUserErr || !authUser?.user?.email) {
      return { error: 'Could not retrieve registered email for this mobile number.' }
    }

    email = authUser.user.email
  }

  const { data: verifyData, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error || !verifyData?.user) {
    return { error: error?.message || 'Invalid or expired verification code' }
  }

  // Get the profile to determine redirection route based on user role and profile completeness
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, education, photos, is_deleted')
    .eq('id', verifyData.user.id)
    .single() as unknown as { data: { role: UserRole; education: string | null; photos: string[]; is_deleted: boolean } | null; error: Error | null }

  if (profileError || !profile) {
    redirect('/')
  }

  // Auto-reactivate: if the user had deactivated their account and is now logging back in,
  // restore their profile automatically — this is their intent signal to come back.
  if (profile.is_deleted) {
    await (supabase.from('profiles') as any)
      .update({ is_deleted: false, deleted_at: null })
      .eq('id', verifyData.user.id)
  }

  if (profile.role === 'super_admin') {
    redirect('/admin')
  } else if (
    ['local_associate', 'block_associate', 'district_associate', 'state_associate'].includes(
      profile.role
    )
  ) {
    redirect('/associate')
  } else {
    const hasPhotos = profile.photos && profile.photos.length > 0
    const hasEducation = !!profile.education
    if (!hasEducation || !hasPhotos) {
      redirect('/onboarding')
    } else {
      redirect('/dashboard')
    }
  }
}

export async function adminSignInAction(rawInput: LoginInput) {
  const validatedFields = loginSchema.safeParse(rawInput)
  if (!validatedFields.success) {
    return { error: 'Invalid email or password' }
  }

  const { email, password } = validatedFields.data
  const supabase = await createClient()

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !signInData?.user || !signInData?.session) {
    return { error: error?.message || 'Failed to authenticate user.' }
  }

  // Force the current supabase client to use the newly acquired session tokens for subsequent queries in this request
  await supabase.auth.setSession({
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
  })

  // 1. Check profiles role for super_admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', signInData.user.id)
    .single() as unknown as { data: { role: UserRole } | null; error: Error | null }

  if (profileError || !profile) {
    console.error('Admin login profile query error:', profileError, 'User ID:', signInData.user.id)
    await supabase.auth.signOut()
    return { error: `Access denied: Profile not found. (Details: ${profileError ? profileError.message : 'Profile record empty'})` }
  }

  if (profile.role === 'super_admin') {
    return { success: true, redirectUrl: '/admin' }
  }

  // 2. Check admin_profiles for active staff
  const { data: adminProfile, error: adminProfileError } = await supabase
    .from('admin_profiles')
    .select('id, status')
    .eq('id', signInData.user.id)
    .eq('status', 'active')
    .single()

  if (adminProfileError || !adminProfile) {
    await supabase.auth.signOut()
    return { error: 'Access denied: You do not have active staff privileges.' }
  }

  return { success: true, redirectUrl: '/admin' }
}

/**
 * Server Action specifically for Associate Login.
 * Verifies that the user has an associate role or is a super_admin.
 */
export async function associateSignInAction(rawInput: LoginInput) {
  const validatedFields = loginSchema.safeParse(rawInput)
  if (!validatedFields.success) {
    return { error: 'Invalid email or password' }
  }

  const { email, password } = validatedFields.data
  const supabase = await createClient()

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !signInData?.user || !signInData?.session) {
    return { error: error?.message || 'Failed to authenticate user.' }
  }

  // Force the current supabase client to use the newly acquired session tokens for subsequent queries in this request
  await supabase.auth.setSession({
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
  })

  // Check profiles role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', signInData.user.id)
    .single() as unknown as { data: { role: UserRole } | null; error: Error | null }

  if (profileError || !profile) {
    await supabase.auth.signOut()
    return { error: 'Access denied: Profile not found.' }
  }

  const ASSOCIATE_ROLES = [
    'local_associate',
    'block_associate',
    'district_associate',
    'state_associate',
  ]

  if (profile.role === 'super_admin' || ASSOCIATE_ROLES.includes(profile.role)) {
    return { success: true, redirectUrl: '/associate' }
  }

  await supabase.auth.signOut()
  return { error: 'Access denied: You do not have associate privileges.' }
}

/**
 * Server Action specifically to register a new Associate.
 * Inserts credentials, profile, associate status, kyc, and bank records.
 */
export async function associateSignUpAction(rawInput: AssociateRegisterInput) {
  const validatedFields = associateRegisterSchema.safeParse(rawInput)
  if (!validatedFields.success) {
    return { error: 'Invalid fields. Please verify your entries.' }
  }

  const {
    email,
    password,
    first_name,
    last_name,
    mobile_number,
    role,
    state,
    district,
    block,
    village_ward,
    aadhaar_number,
    pan_number,
    bank_account_number,
    bank_ifsc_code,
    bank_holder_name,
    experience,
    occupation,
    languages,
  } = validatedFields.data

  const supabase = await createClient()

  // 1. Create User in Supabase Auth
  const { data: signUpData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name,
        last_name,
        mobile_number,
        role, // E.g. 'local_associate', 'block_associate', etc.
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`,
    },
  })

  if (authError) {
    return { error: authError.message }
  }

  if (signUpData?.user) {
    try {
      const adminSupabase = await createAdminClient()
      const userId = signUpData.user.id

      // 2. Update/Insert Profile in public.profiles (Supabase trigger might insert basic profile, but we must update it with correct location & role)
      const { error: profileError } = await (adminSupabase.from('profiles') as any)
        .update({
          first_name,
          last_name,
          role,
          state,
          city: block || district || '', // map local city to block/district
          mobile_number,
          education: `Occupation: ${occupation} | Experience: ${experience} years | Languages: ${languages}`,
        })
        .eq('id', userId)

      if (profileError) throw profileError

      // 3. Insert record in associates table with parent_associate_id logic
      let parentAssociateId: string | null = null

      // Hierarchy mapping logic (e.g. find parent in same territory)
      if (role === 'local_associate') {
        // Find a Block Associate in the same block/district
        const { data: parentAssoc } = await (adminSupabase.from('profiles') as any)
          .select('id')
          .eq('role', 'block_associate')
          .eq('city', block || district || '')
          .limit(1)
          .maybeSingle()

        if (parentAssoc) parentAssociateId = parentAssoc.id
      } else if (role === 'block_associate') {
        // Find a District Associate in the same district
        const { data: parentAssoc } = await (adminSupabase.from('profiles') as any)
          .select('id')
          .eq('role', 'district_associate')
          .eq('city', district || '')
          .limit(1)
          .maybeSingle()

        if (parentAssoc) parentAssociateId = parentAssoc.id
      } else if (role === 'district_associate') {
        // Find a State Associate in the same state
        const { data: parentAssoc } = await (adminSupabase.from('profiles') as any)
          .select('id')
          .eq('role', 'state_associate')
          .eq('state', state)
          .limit(1)
          .maybeSingle()

        if (parentAssoc) parentAssociateId = parentAssoc.id
      }

      const { error: assocError } = await (adminSupabase.from('associates') as any)
        .insert({
          id: userId,
          parent_associate_id: parentAssociateId,
          status: 'pending_kyc',
          wallet_balance: 0.00,
        })

      if (assocError) throw assocError

      // 4. Insert record in associate_kyc table
      const { error: kycError } = await (adminSupabase.from('associate_kyc') as any)
        .insert({
          id: userId,
          national_id_type: 'aadhaar',
          national_id_number: aadhaar_number,
          id_proof_url: 'placeholder_aadhaar_url',
          address_proof_url: 'placeholder_address_url',
          kyc_status: 'pending',
          verification_notes: `PAN Number: ${pan_number} | Village/Ward: ${village_ward || 'N/A'}`,
        })

      if (kycError) throw kycError

      // 5. Insert record in associate_bank_accounts
      const { error: bankError } = await (adminSupabase.from('associate_bank_accounts') as any)
        .insert({
          associate_id: userId,
          account_holder_name: bank_holder_name,
          bank_name: 'Registered Bank',
          account_number: bank_account_number,
          ifsc_code: bank_ifsc_code,
          is_primary: true,
          is_verified: false,
        })

      if (bankError) throw bankError

      // 6. Insert territory_assignments
      const { error: territoryError } = await (adminSupabase.from('territory_assignments') as any)
        .insert({
          associate_id: userId,
          level: role === 'state_associate' ? 'state' : role === 'district_associate' ? 'district' : 'block',
          state,
          district: role !== 'state_associate' ? district : null,
          block: (role === 'local_associate' || role === 'block_associate') ? block : null,
        })

      if (territoryError) throw territoryError

    } catch (dbErr: any) {
      console.error('Failed to create complete associate profile hierarchy records:', dbErr)
      return { error: `Database setup failed: ${dbErr.message || dbErr}` }
    }
  }

  return { success: true }
}
