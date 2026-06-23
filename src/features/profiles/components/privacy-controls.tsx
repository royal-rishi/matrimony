'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, EyeOff, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { privacyControlsSchema, type PrivacyControlsInput } from '../validators/profile-validators'
import { updatePrivacySettings } from '../actions/profile-actions'

interface PrivacyControlsProps {
  photoPrivacyTier: 'public' | 'verified_members' | 'connections'
  lastNamePrivacy: boolean
}

export function PrivacyControls({ photoPrivacyTier, lastNamePrivacy }: PrivacyControlsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    handleSubmit,
    setValue,
    watch,
  } = useForm<PrivacyControlsInput>({
    resolver: zodResolver(privacyControlsSchema),
    defaultValues: {
      photo_privacy_tier: photoPrivacyTier,
      last_name_privacy: lastNamePrivacy,
    },
  })

  const currentPhotoPrivacy = watch('photo_privacy_tier')
  const currentLastNamePrivacy = watch('last_name_privacy')

  const onSubmit = async (data: PrivacyControlsInput) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await updatePrivacySettings(data)
      if (result?.error) {
        setError(result.error)
        toast.error('Failed to update privacy settings')
      } else {
        toast.success('Privacy settings updated successfully!')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-zinc-200/50 shadow-lg bg-white/95 dark:bg-zinc-900/95">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <EyeOff className="h-5 w-5 text-rose-500" />
          Privacy & Visibility Controls
        </CardTitle>
        <CardDescription>
          Control who can view your photos and profile credentials.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-100">
              {error}
            </div>
          )}

          {/* Photo Privacy Dropdown */}
          <div className="space-y-2.5 max-w-md">
            <Label htmlFor="photo-privacy">Who can view your photos?</Label>
            <Select value={currentPhotoPrivacy} onValueChange={(val) => setValue('photo_privacy_tier', val as 'public' | 'verified_members' | 'connections')} disabled={isLoading}>
              <SelectTrigger id="photo-privacy" className="h-10">
                <SelectValue placeholder="Select photo visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Everyone (Publicly visible)</SelectItem>
                <SelectItem value="verified_members">Only KYC-Verified Members (Recommended)</SelectItem>
                <SelectItem value="connections">Only My Accepted Matches</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-zinc-400">
              Selecting &quot;Only My Accepted Matches&quot; will show a blurred lock placeholder to all other members.
            </p>
          </div>

          {/* Last Name Privacy Toggle */}
          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="lastname-privacy"
                checked={currentLastNamePrivacy}
                disabled={isLoading}
                onChange={(e) => setValue('last_name_privacy', e.target.checked)}
                className="h-4.5 w-4.5 rounded border-zinc-300 text-rose-600 focus:ring-rose-500 accent-rose-600 transition-all cursor-pointer mt-0.5"
              />
              <div className="space-y-0.5">
                <Label htmlFor="lastname-privacy" className="cursor-pointer font-bold text-zinc-800 dark:text-zinc-200">
                  Hide my last name from search results
                </Label>
                <p className="text-[11px] text-zinc-400">
                  If enabled, other users will only see your first name (e.g. &quot;Ananya I.&quot; or &quot;Ananya&quot; instead of &quot;Ananya Iyer&quot;).
                </p>
              </div>
            </div>
          </div>

          {/* Verification indicator */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg text-xs text-zinc-500 flex items-start gap-2 border border-zinc-200/30">
            <ShieldCheck className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <span>
              Rishtajodo takes member security seriously. Your contact number and email address are never exposed publicly and are only shared with your explicit approval.
            </span>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end border-t border-zinc-100 dark:border-zinc-800/80 p-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="h-10 px-6 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-semibold rounded-lg shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Privacy...
              </>
            ) : (
              'Save Privacy Settings'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
