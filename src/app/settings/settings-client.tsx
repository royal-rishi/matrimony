'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  User, 
  Lock, 
  EyeOff, 
  Bell, 
  ShieldAlert, 
  Save, 
  Smartphone, 
  Mail, 
  Loader2 
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Profile } from '@/types/database'
import { 
  updateAccountInfoAction, 
  changePasswordAction, 
  updatePrivacyTogglesAction, 
  deactivateAccountAction 
} from '@/features/profiles/actions/settings-actions'

interface SettingsClientProps {
  profile: Profile
  userEmail: string
}

export function SettingsClient({ profile, userEmail }: SettingsClientProps) {
  const router = useRouter()
  
  // States for loading indicators
  const [updatingAccount, setUpdatingAccount] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  // Account form states
  const [email, setEmail] = useState(userEmail)
  const [mobileNumber, setMobileNumber] = useState(profile.mobile_number || '')
  
  // Password form states
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Privacy toggles states
  const [hidePhone, setHidePhone] = useState(profile.hide_phone || false)
  const [hideIncome, setHideIncome] = useState(profile.hide_income || false)
  const [hidePhotos, setHidePhotos] = useState(profile.hide_photos || false)
  const [hideLastSeen, setHideLastSeen] = useState(profile.hide_last_seen || false)
  const [lastNamePrivacy, setLastNamePrivacy] = useState(profile.last_name_privacy || false)
  const [photoPrivacyTier, setPhotoPrivacyTier] = useState<'public' | 'verified_members' | 'connections'>(
    (profile.photo_privacy_tier as 'public' | 'verified_members' | 'connections') || 'public'
  )

  // Notification toggles states (simulated state)
  const [emailInterests, setEmailInterests] = useState(true)
  const [emailMessages, setEmailMessages] = useState(true)
  const [smsMatches, setSmsMatches] = useState(true)
  const [pushVerify, setPushVerify] = useState(true)

  // Handle Account Info Save
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingAccount(true)
    
    try {
      const res = await updateAccountInfoAction(email, mobileNumber)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Account information updated successfully.')
        if (email !== userEmail) {
          toast.info('A confirmation email has been sent to your new address.')
        }
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setUpdatingAccount(false)
    }
  }

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }
    
    setChangingPassword(true)
    try {
      const res = await changePasswordAction(password)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Password changed successfully.')
        setPassword('')
        setConfirmPassword('')
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setChangingPassword(false)
    }
  }

  // Handle Privacy Toggles Save
  const handleSavePrivacy = async () => {
    setUpdatingPrivacy(true)
    try {
      const res = await updatePrivacyTogglesAction({
        hide_phone: hidePhone,
        hide_income: hideIncome,
        hide_photos: hidePhotos,
        hide_last_seen: hideLastSeen,
        last_name_privacy: lastNamePrivacy,
        photo_privacy_tier: photoPrivacyTier,
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Privacy settings saved successfully.')
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setUpdatingPrivacy(false)
    }
  }

  // Handle Notification Toggles Save
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('Notification preferences updated.')
  }

  // Handle Account Deactivation
  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate your profile? You will be signed out, and your profile will be hidden from search until you log back in.')) {
      return
    }

    setDeactivating(true)
    try {
      const res = await deactivateAccountAction()
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Your profile has been deactivated.')
        router.push('/')
        router.refresh()
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setDeactivating(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent dark:from-pink-400 dark:to-rose-400">
          Account & Settings
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Manage your matrimonial credentials, privacy toggles, and notification alerts.
        </p>
      </div>

      <Tabs defaultValue="privacy" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-zinc-100 p-1 rounded-xl dark:bg-zinc-900 border dark:border-zinc-800">
          <TabsTrigger value="privacy" className="rounded-lg text-sm font-semibold flex items-center justify-center gap-2 py-2">
            <EyeOff className="h-4 w-4" />
            <span className="hidden sm:inline">Privacy Toggles</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="rounded-lg text-sm font-semibold flex items-center justify-center gap-2 py-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account Info</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg text-sm font-semibold flex items-center justify-center gap-2 py-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg text-sm font-semibold flex items-center justify-center gap-2 py-2">
            <ShieldAlert className="h-4 w-4" />
            <span className="hidden sm:inline">Security Actions</span>
          </TabsTrigger>
        </TabsList>

        {/* PRIVACY TOGGLES TAB */}
        <TabsContent value="privacy" className="mt-6">
          <Card className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-pink-100/50 dark:border-zinc-800/50 shadow-xl shadow-pink-150/5">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                <EyeOff className="h-5 w-5 text-pink-500" />
                Matrimonial Privacy Toggles
              </CardTitle>
              <CardDescription>
                Control exactly who sees your contact details, income, photos, and online status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Photo Privacy Dropdown */}
              <div className="space-y-2 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <Label htmlFor="photo-privacy" className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Profile Photo Visibility
                </Label>
                <div className="max-w-md">
                  <Select
                    value={photoPrivacyTier}
                    onValueChange={(val: string | null) => { if (val) setPhotoPrivacyTier(val as any) }}
                  >
                    <SelectTrigger className="w-full rounded-lg border-zinc-200 dark:border-zinc-800">
                      <SelectValue placeholder="Select who can view your photos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public (All Users)</SelectItem>
                      <SelectItem value="verified_members">Verified Members Only</SelectItem>
                      <SelectItem value="connections">My Accepted Connections Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-zinc-400">
                  Select &quot;Connections&quot; to blur your album photos until you accept their interest.
                </p>
              </div>

              {/* Toggles Container */}
              <div className="space-y-5">
                {/* Hide Phone Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5 max-w-[80%]">
                    <Label className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Hide Mobile Number</Label>
                    <p className="text-xs text-zinc-400">
                      Don&apos;t display your mobile number to users unless they have a premium subscription.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hidePhone}
                      onChange={(e) => setHidePhone(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-650 peer-checked:bg-pink-600"></div>
                  </label>
                </div>

                {/* Hide Income Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5 max-w-[80%]">
                    <Label className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Hide Annual Income</Label>
                    <p className="text-xs text-zinc-400">
                      Prevent matchmaking candidates from viewing your annual income on your profile card.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideIncome}
                      onChange={(e) => setHideIncome(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-650 peer-checked:bg-pink-600"></div>
                  </label>
                </div>

                {/* Hide Photos Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5 max-w-[80%]">
                    <Label className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Blur All Photos</Label>
                    <p className="text-xs text-zinc-400">
                      Force lock/blur all profile pictures until you explicitly send or accept their matchmaking connection.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hidePhotos}
                      onChange={(e) => setHidePhotos(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-650 peer-checked:bg-pink-600"></div>
                  </label>
                </div>

                {/* Hide Last Seen Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5 max-w-[80%]">
                    <Label className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Hide Online Status</Label>
                    <p className="text-xs text-zinc-400">
                      Hide your &quot;Last Active&quot; indicator. Other users won&apos;t know when you are actively browsing matches.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideLastSeen}
                      onChange={(e) => setHideLastSeen(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-650 peer-checked:bg-pink-600"></div>
                  </label>
                </div>

                {/* Last Name Privacy Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5 max-w-[80%]">
                    <Label className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Last Name Confidentiality</Label>
                    <p className="text-xs text-zinc-400">
                      Only display the first letter of your surname (e.g. &quot;{profile.first_name} {profile.last_name ? profile.last_name[0] + '.' : ''}&quot;) to prevent unwanted online lookups.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lastNamePrivacy}
                      onChange={(e) => setLastNamePrivacy(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-650 peer-checked:bg-pink-600"></div>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                <Button 
                  onClick={handleSavePrivacy}
                  disabled={updatingPrivacy}
                  className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold flex items-center gap-2 rounded-lg h-11 px-6 shadow-md transition-all active:scale-[0.98]"
                >
                  {updatingPrivacy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Privacy Controls
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACCOUNT INFO & PASSWORD TAB */}
        <TabsContent value="account" className="mt-6 space-y-6">
          {/* Account Details Form */}
          <Card className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-pink-100/50 dark:border-zinc-800/50 shadow-xl shadow-pink-150/5">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                <User className="h-5 w-5 text-pink-500" />
                Matrimonial Credentials
              </CardTitle>
              <CardDescription>
                Update the mobile number and registered email address of your matchmaking account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-zinc-400" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="rounded-lg border-zinc-200 dark:border-zinc-800"
                    />
                    <p className="text-xs text-zinc-400">
                      Changing email requires dual-link verification validation.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile" className="text-sm font-semibold flex items-center gap-1.5">
                      <Smartphone className="h-4 w-4 text-zinc-400" />
                      Mobile Number
                    </Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      required
                      placeholder="e.g. +91 0123456789"
                      className="rounded-lg border-zinc-200 dark:border-zinc-800"
                    />
                    <p className="text-xs text-zinc-400">
                      Used for secure login OTPs and verification.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={updatingAccount}
                    className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold flex items-center gap-2 rounded-lg h-11 px-6 shadow-md transition-all active:scale-[0.98]"
                  >
                    {updatingAccount && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Info
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-pink-100/50 dark:border-zinc-800/50 shadow-xl shadow-pink-150/5">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                <Lock className="h-5 w-5 text-pink-500" />
                Change Password
              </CardTitle>
              <CardDescription>
                Change the password you use to sign in to RishtaJodo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pass" className="text-sm font-semibold">New Password</Label>
                    <Input
                      id="pass"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Minimum 6 characters"
                      className="rounded-lg border-zinc-200 dark:border-zinc-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conf-pass" className="text-sm font-semibold">Confirm New Password</Label>
                    <Input
                      id="conf-pass"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repeat new password"
                      className="rounded-lg border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={changingPassword}
                    className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold flex items-center gap-2 rounded-lg h-11 px-6 shadow-md transition-all active:scale-[0.98]"
                  >
                    {changingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATION PREFERENCES TAB */}
        <TabsContent value="notifications" className="mt-6">
          <Card className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-pink-100/50 dark:border-zinc-800/50 shadow-xl shadow-pink-150/5">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                <Bell className="h-5 w-5 text-pink-500" />
                Notification Channels
              </CardTitle>
              <CardDescription>
                Decide what alerts you want to receive via Email, SMS, or Push notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveNotifications} className="space-y-6">
                <div className="space-y-4">
                  {/* Email Interests */}
                  <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div>
                      <Label className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Email: Matches & Interests</Label>
                      <p className="text-xs text-zinc-400">Receive email alerts when someone sends or accepts an interest.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailInterests}
                        onChange={(e) => setEmailInterests(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-650 peer-checked:bg-pink-600"></div>
                    </label>
                  </div>

                  {/* Email Messages */}
                  <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div>
                      <Label className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Email: Messages Summary</Label>
                      <p className="text-xs text-zinc-400">Get summaries of unread chat messages when you are offline.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailMessages}
                        onChange={(e) => setEmailMessages(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-650 peer-checked:bg-pink-600"></div>
                    </label>
                  </div>

                  {/* SMS Alerts */}
                  <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div>
                      <Label className="text-sm font-bold text-zinc-800 dark:text-zinc-200">SMS: Verification & Safety updates</Label>
                      <p className="text-xs text-zinc-400">Receive SMS notifications for KYC status and emergency safety reports.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smsMatches}
                        onChange={(e) => setSmsMatches(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-650 peer-checked:bg-pink-600"></div>
                    </label>
                  </div>

                  {/* Push Notifications */}
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <Label className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Browser Push Notifications</Label>
                      <p className="text-xs text-zinc-400">Get instant chat triggers and match alerts in your web browser.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pushVerify}
                        onChange={(e) => setPushVerify(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-650 peer-checked:bg-pink-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold flex items-center gap-2 rounded-lg h-11 px-6 shadow-md transition-all active:scale-[0.98]"
                  >
                    <Save className="h-4 w-4" />
                    Save Preferences
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY & ACCOUNT DEACTIVATION TAB */}
        <TabsContent value="security" className="mt-6">
          <Card className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-red-100/50 dark:border-red-950/30 shadow-xl shadow-red-100/5">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Actions related to account deactivation, de-registration, or deletion.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Deactivate account */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-red-100/30">
                <div className="space-y-1 max-w-[80%]">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Temporarily Deactivate Profile
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Your profile, photos, and contact information will be hidden from search results. Your existing messages and interests will be archived. You can reactive your account anytime by logging back in.
                  </p>
                </div>
                <Button
                  onClick={handleDeactivate}
                  disabled={deactivating}
                  variant="outline"
                  className="border-red-200 text-red-650 hover:bg-red-50 hover:text-red-750 font-bold self-start sm:self-center shrink-0"
                >
                  {deactivating && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                  Deactivate Account
                </Button>
              </div>

              {/* Account Deletion Info */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Permanent Account De-registration
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  If you have found your life partner (within or outside RishtaJodo) and wish to permanently close your account, please submit a marriage completion form or write to our support desk to delete all personal credentials, matchmaking matching charts, and chat transcript logs forever.
                </p>
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => router.push('/support')}
                    variant="outline"
                    className="border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-semibold"
                  >
                    Contact Support Desk
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
