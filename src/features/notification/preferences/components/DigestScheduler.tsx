'use client'

// ============================================================
// DIGEST SCHEDULER COMPONENT
// ============================================================

import React from 'react'
import type { UserPreferencesData, UserPreferencesDigest, DigestTimeOption } from '../types/preferences.types'

interface DigestSchedulerProps {
  preferences: UserPreferencesData
  onChange: (digest: UserPreferencesDigest) => void
}

export const DigestScheduler: React.FC<DigestSchedulerProps> = ({ preferences, onChange }) => {
  const digest = preferences.digest

  const updateDigest = (key: keyof UserPreferencesDigest, value: any) => {
    onChange({
      ...digest,
      [key]: value,
    })
  }

  const toggleDay = (day: string) => {
    const active = [...digest.weeklyDays]
    if (active.includes(day)) {
      updateDigest('weeklyDays', active.filter(d => d !== day))
    } else {
      updateDigest('weeklyDays', [...active, day])
    }
  }

  const timeOptions: { value: DigestTimeOption; label: string; time: string }[] = [
    { value: 'morning', label: 'Morning (09:00 AM)', time: '09:00' },
    { value: 'afternoon', label: 'Afternoon (02:00 PM)', time: '14:00' },
    { value: 'evening', label: 'Evening (07:00 PM)', time: '19:00' },
    { value: 'custom', label: 'Custom Time', time: digest.dailyCustomTime },
  ]

  const weekDays = ['Monday', 'Friday', 'Sunday']

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Digest Schedules</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Determine when and how frequently you receive match recommendations and partner search reports.
        </p>
      </div>

      <div className="space-y-6 bg-gray-50/50 dark:bg-gray-900/40 p-5 rounded-xl border border-gray-100 dark:border-gray-800/60">
        {/* Daily Digest */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Daily Match Digest</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">A daily summary of new matches matching your partner filters.</p>
            </div>
            
            <input
              type="checkbox"
              checked={preferences.categories.email.matchDigest}
              onChange={(e) => {
                const updated = { ...preferences.categories }
                updated.email = { ...updated.email, matchDigest: e.target.checked }
                // Propagate up (handled by parent context updates)
              }}
              className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          {preferences.categories.email.matchDigest && (
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Preferred Delivery Hour
                </label>
                <select
                  value={digest.dailyTime}
                  onChange={(e) => {
                    const val = e.target.value as DigestTimeOption
                    updateDigest('dailyTime', val)
                    const matched = timeOptions.find(o => o.value === val)
                    if (matched && val !== 'custom') {
                      updateDigest('dailyCustomTime', matched.time)
                    }
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
                >
                  {timeOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {digest.dailyTime === 'custom' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Specify Custom Time (HH:MM)
                  </label>
                  <input
                    type="time"
                    value={digest.dailyCustomTime}
                    onChange={(e) => updateDigest('dailyCustomTime', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-850 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

        {/* Weekly Digest */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Weekly Activity Report</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Weekly telemetry summary of profile visitors, views, and matched responses.</p>
            </div>
            
            <input
              type="checkbox"
              checked={preferences.categories.email.weeklyDigest}
              onChange={(e) => {
                // Propagated to email category updates
              }}
              className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          {preferences.categories.email.weeklyDigest && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                  Select Delivery Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all duration-150 cursor-pointer ${
                        digest.weeklyDays.includes(day)
                          ? 'bg-rose-500 border-rose-500 text-white'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-850 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                    Weekly Delivery Time
                  </label>
                  <input
                    type="time"
                    value={digest.weeklyCustomTime}
                    onChange={(e) => updateDigest('weeklyCustomTime', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-850 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
