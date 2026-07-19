'use client'

// ============================================================
// OTP METHOD SELECTOR COMPONENT
// ============================================================

import React from 'react'
import type { UserPreferencesData, OtpMethod } from '../types/preferences.types'

interface OTPMethodSelectorProps {
  preferences: UserPreferencesData
  onChange: (method: OtpMethod, autoFallback: boolean) => void
}

export const OTPMethodSelector: React.FC<OTPMethodSelectorProps> = ({ preferences, onChange }) => {
  const method = preferences.otpPreference
  const fallback = preferences.autoFallback

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">OTP Verification settings</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure how you want to receive registration, login, and billing authentication codes.
        </p>
      </div>

      <div className="bg-gray-50/50 dark:bg-gray-900/40 p-5 rounded-xl border border-gray-100 dark:border-gray-800/60 space-y-5">
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
            Preferred OTP Channel
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {/* SMS Option */}
            <label
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
                method === 'sms'
                  ? 'border-rose-500 bg-rose-50/20 dark:border-rose-900/40 dark:bg-rose-950/10'
                  : 'border-gray-150 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900'
              }`}
            >
              <input
                type="radio"
                name="otp_method"
                value="sms"
                checked={method === 'sms'}
                onChange={() => onChange('sms', fallback)}
                className="w-4 h-4 text-rose-600 focus:ring-rose-500 border-gray-300 dark:border-gray-700 dark:bg-gray-800"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white block">Transactional SMS</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Sent directly via MSG91 SMS gateway.</span>
              </div>
            </label>

            {/* WhatsApp Option */}
            <label
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
                method === 'whatsapp'
                  ? 'border-rose-500 bg-rose-50/20 dark:border-rose-900/40 dark:bg-rose-950/10'
                  : 'border-gray-150 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900'
              }`}
            >
              <input
                type="radio"
                name="otp_method"
                value="whatsapp"
                checked={method === 'whatsapp'}
                onChange={() => onChange('whatsapp', fallback)}
                className="w-4 h-4 text-rose-600 focus:ring-rose-500 border-gray-300 dark:border-gray-700 dark:bg-gray-800"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white block">WhatsApp Business</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Interactive templates via WhatsApp.</span>
              </div>
            </label>
          </div>
        </div>

        <div className="h-px bg-gray-150 dark:bg-gray-800"></div>

        {/* Auto Fallback */}
        <div className="flex items-start justify-between">
          <div className="space-y-0.5 pr-4">
            <span className="text-sm font-semibold text-gray-850 dark:text-gray-250">Auto Channel Fallback</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
              If the preferred OTP channel experiences delays or network delivery issues, automatically resend via the alternative channel.
            </p>
          </div>

          <input
            type="checkbox"
            checked={fallback}
            onChange={(e) => onChange(method, e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
      </div>
    </div>
  )
}
