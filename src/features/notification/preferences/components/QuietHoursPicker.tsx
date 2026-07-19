'use client'

// ============================================================
// QUIET HOURS PICKER COMPONENT
// ============================================================

import React from 'react'
import type { UserPreferencesData } from '../types/preferences.types'
import { PREFERENCES_CONFIG } from '../config/preferences.config'

interface QuietHoursPickerProps {
  preferences: UserPreferencesData
  onChange: (updates: { quietHoursStart: string | null; quietHoursEnd: string | null; timezone: string }) => void
}

export const QuietHoursPicker: React.FC<QuietHoursPickerProps> = ({ preferences, onChange }) => {
  const isEnabled = preferences.quietHoursStart !== null && preferences.quietHoursEnd !== null
  const start = preferences.quietHoursStart || '22:00'
  const end = preferences.quietHoursEnd || '08:00'

  const toggleQuietHours = (active: boolean) => {
    onChange({
      quietHoursStart: active ? start : null,
      quietHoursEnd: active ? end : null,
      timezone: preferences.timezone,
    })
  }

  const handleTimeChange = (key: 'start' | 'end', val: string) => {
    onChange({
      quietHoursStart: key === 'start' ? val : start,
      quietHoursEnd: key === 'end' ? val : end,
      timezone: preferences.timezone,
    })
  }

  const handleTimezoneChange = (tz: string) => {
    onChange({
      quietHoursStart: preferences.quietHoursStart,
      quietHoursEnd: preferences.quietHoursEnd,
      timezone: tz,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quiet Hours & Do-Not-Disturb</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Silence SMS and WhatsApp notification pings during your sleeping hours. Critical security alerts bypass quiet hours.
        </p>
      </div>

      <div className="bg-gray-50/50 dark:bg-gray-900/40 p-5 rounded-xl border border-gray-100 dark:border-gray-800/60 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Enable Quiet Hours</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">Silences phone alerts during selected times.</p>
          </div>
          
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => toggleQuietHours(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer dark:border-gray-700 dark:bg-gray-800"
          />
        </div>

        {isEnabled && (
          <div className="grid gap-4 sm:grid-cols-2 pt-2 animate-fade-in">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Start Time (Sleep)
              </label>
              <input
                type="time"
                value={start}
                onChange={(e) => handleTimeChange('start', e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-850 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                End Time (Wake)
              </label>
              <input
                type="time"
                value={end}
                onChange={(e) => handleTimeChange('end', e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-850 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
              />
            </div>
          </div>
        )}

        <div className="space-y-2 pt-1">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
            Timezone
          </label>
          <select
            value={preferences.timezone}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
          >
            {PREFERENCES_CONFIG.supportedTimezones.map((tz) => (
              <option key={tz.code} value={tz.code}>
                {tz.label} ({tz.code})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
