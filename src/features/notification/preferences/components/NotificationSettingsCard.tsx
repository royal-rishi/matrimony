'use client'

// ============================================================
// MAIN NOTIFICATION SETTINGS WRAPPER CARD
// ============================================================

import React, { useEffect, useState } from 'react'
import { getPreferences, updatePreferences, resetPreferences } from '../actions/preferences.actions'
import type { UserPreferencesData } from '../types/preferences.types'
import { ChannelSelector } from './ChannelSelector'
import { OTPMethodSelector } from './OTPMethodSelector'
import { DigestScheduler } from './DigestScheduler'
import { QuietHoursPicker } from './QuietHoursPicker'
import { CategoryMatrix } from './CategoryMatrix'
import { PREFERENCES_CONFIG } from '../config/preferences.config'
import { toast } from 'sonner'

export const NotificationSettingsCard: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferencesData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)

  // 1. Fetch preferences on mount
  useEffect(() => {
    async function load() {
      const res = await getPreferences()
      if (res.success && res.data) {
        setPreferences(res.data)
      } else {
        toast.error('Failed to load notification settings.')
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleChannelChange = (key: keyof UserPreferencesData, val: boolean) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      [key]: val,
    })
  }

  const handleCategoryChange = (updatedCategories: any) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      categories: updatedCategories,
    })
  }

  const handleDigestChange = (updatedDigest: any) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      digest: updatedDigest,
    })
  }

  const handleQuietHoursChange = (updates: any) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      quietHoursStart: updates.quietHoursStart,
      quietHoursEnd: updates.quietHoursEnd,
      timezone: updates.timezone,
    })
  }

  const handleOTPChange = (method: any, fallback: boolean) => {
    if (!preferences) return
    
    const updates: any = {
      otpPreference: method,
      autoFallback: fallback,
    }

    // Auto-enable channel if selected as preferred
    if (method === 'whatsapp') {
      updates.whatsappEnabled = true
    } else if (method === 'sms') {
      updates.smsEnabled = true
    }

    setPreferences({
      ...preferences,
      ...updates,
    })
  }

  const handlePrivacyChange = (key: string, val: boolean) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      privacy: {
        ...preferences.privacy,
        [key]: val,
      },
    })
  }

  const handleLanguageChange = (lang: string) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      language: lang,
    })
  }

  // 2. Save settings
  const handleSave = async () => {
    if (!preferences) return
    setSaving(true)
    
    const res = await updatePreferences(preferences)
    
    if (res.success && res.data) {
      setPreferences(res.data)
      toast.success('Notification settings saved successfully.')
    } else {
      toast.error(res.error || 'Failed to save preferences.')
    }
    setSaving(false)
  }

  // 3. Reset settings
  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all notification preferences to factory default values?')) {
      return
    }
    setSaving(true)
    const res = await resetPreferences()
    if (res.success && res.data) {
      setPreferences(res.data)
      toast.success('Preferences reset to default values.')
    } else {
      toast.error('Failed to reset preferences.')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 text-gray-500">
        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium animate-pulse">Loading settings...</p>
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="p-8 text-center border border-dashed rounded-xl text-gray-500">
        <p className="text-sm font-medium">Unable to load settings dashboard.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-900 bg-rose-50/10 dark:bg-rose-950/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Communication Preference Center</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Configure quiet hours, digests, verification channels, and alerts.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer dark:bg-gray-900 dark:border-gray-800 dark:text-white dark:hover:bg-gray-800 disabled:opacity-50"
          >
            Reset Defaults
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-xs font-semibold text-white bg-rose-500 rounded-xl hover:bg-rose-600 cursor-pointer disabled:opacity-50 shadow-sm transition-all duration-150"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8 divide-y divide-gray-100 dark:divide-gray-900">
        {/* Section 1: Channels */}
        <ChannelSelector preferences={preferences} onChange={handleChannelChange} />

        {/* Section 2: OTP Selection */}
        <div className="pt-8">
          <OTPMethodSelector preferences={preferences} onChange={handleOTPChange} />
        </div>

        {/* Section 3: Categories Matrix */}
        <div className="pt-8">
          <CategoryMatrix preferences={preferences} onChange={handleCategoryChange} />
        </div>

        {/* Section 4: Scheduled Digests */}
        <div className="pt-8">
          <DigestScheduler preferences={preferences} onChange={handleDigestChange} />
        </div>

        {/* Section 5: Quiet Hours */}
        <div className="pt-8">
          <QuietHoursPicker preferences={preferences} onChange={handleQuietHoursChange} />
        </div>

        {/* Section 6: Language */}
        <div className="pt-8 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Preferred Language</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Select which locale to use for email and WhatsApp templates.</p>
          </div>
          
          <select
            value={preferences.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full sm:max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            {PREFERENCES_CONFIG.supportedLanguages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.label}</option>
            ))}
          </select>
        </div>

        {/* Section 7: Privacy */}
        <div className="pt-8 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Privacy</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Configure notifications relating to profile visitors and recommendations.</p>
          </div>
          
          <div className="bg-gray-50/50 dark:bg-gray-900/40 p-5 rounded-xl border border-gray-100 dark:border-gray-800/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-gray-850 dark:text-gray-250">Hide Profile Viewed Alerts</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Do not send alerts when other members view your profile card.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.privacy.hideProfileViewed}
                onChange={(e) => handlePrivacyChange('hideProfileViewed', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            <div className="h-px bg-gray-150 dark:bg-gray-800"></div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-gray-850 dark:text-gray-250">Hide Match Recommendations</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Do not alert me when matchmaking algorithms flag new candidates.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.privacy.hideMatchRecommendations}
                onChange={(e) => handlePrivacyChange('hideMatchRecommendations', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer dark:border-gray-700 dark:bg-gray-800"
              />
            </div>

            <div className="h-px bg-gray-150 dark:bg-gray-800"></div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-gray-850 dark:text-gray-250">Receive Anonymous Visitor Alerts</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Send alerts for visitors browsing in stealth/anonymous mode.</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.privacy.receiveAnonymousVisitor}
                onChange={(e) => handlePrivacyChange('receiveAnonymousVisitor', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gray-50/50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-900 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer dark:bg-gray-900 dark:border-gray-800 dark:text-white dark:hover:bg-gray-800 disabled:opacity-50"
        >
          Reset Defaults
        </button>
        
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 text-xs font-semibold text-white bg-rose-500 rounded-xl hover:bg-rose-600 cursor-pointer disabled:opacity-50 shadow-sm"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
