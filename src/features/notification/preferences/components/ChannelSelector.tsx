'use client'

// ============================================================
// CHANNEL SELECTOR COMPONENT (Master Channel Toggles)
// ============================================================

import React from 'react'
import type { UserPreferencesData } from '../types/preferences.types'

interface ChannelSelectorProps {
  preferences: UserPreferencesData
  onChange: (key: keyof UserPreferencesData, value: boolean) => void
}

export const ChannelSelector: React.FC<ChannelSelectorProps> = ({ preferences, onChange }) => {
  const channels = [
    {
      key: 'inAppEnabled' as const,
      label: 'In-App Notifications',
      description: 'Real-time notifications sent to your bell icon on the platform.',
      disabled: false,
    },
    {
      key: 'emailEnabled' as const,
      label: 'Email Notifications',
      description: 'Important updates, matchmaking digests, and invoices sent to your mailbox.',
      disabled: false,
    },
    {
      key: 'smsEnabled' as const,
      label: 'SMS Notifications',
      description: 'Outbound transactional texts and meeting updates sent directly to your phone.',
      disabled: false,
    },
    {
      key: 'whatsappEnabled' as const,
      label: 'WhatsApp Notifications',
      description: 'Template updates, shared profiles recommendations, and support alerts via WhatsApp.',
      disabled: false,
    },
    {
      key: 'pushEnabled' as const,
      label: 'Push Notifications',
      description: 'Real-time alert prompts sent directly to your device browser/app.',
      disabled: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Communication Channels</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Control which delivery channels are enabled globally for your account.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {channels.map((chan) => (
          <div
            key={chan.key}
            className={`flex items-start justify-between p-4 rounded-xl border transition-all duration-200 ${
              preferences[chan.key]
                ? 'bg-rose-50/40 border-rose-200 dark:bg-rose-950/10 dark:border-rose-900/30'
                : 'bg-white border-gray-100 dark:bg-gray-900 dark:border-gray-800'
            }`}
          >
            <div className="space-y-1 pr-4">
              <label
                htmlFor={chan.key}
                className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer select-none"
              >
                {chan.label}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
                {chan.description}
              </p>
            </div>
            
            <div className="flex items-center">
              <input
                id={chan.key}
                type="checkbox"
                checked={preferences[chan.key]}
                disabled={chan.disabled}
                onChange={(e) => onChange(chan.key, e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer dark:border-gray-700 dark:bg-gray-800 disabled:opacity-55"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
