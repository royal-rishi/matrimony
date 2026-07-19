'use client'

// ============================================================
// CATEGORY MATRIX COMPONENT (Channel Categories Selection)
// ============================================================

import React from 'react'
import type { UserPreferencesData, UserPreferencesCategories } from '../types/preferences.types'

interface CategoryMatrixProps {
  preferences: UserPreferencesData
  onChange: (categories: UserPreferencesCategories) => void
}

export const CategoryMatrix: React.FC<CategoryMatrixProps> = ({ preferences, onChange }) => {
  const updateCategory = (
    channel: keyof UserPreferencesCategories,
    categoryKey: string,
    value: boolean
  ) => {
    const updated = { ...preferences.categories }
    const channelSection = { ...updated[channel] } as any
    channelSection[categoryKey] = value
    updated[channel] = channelSection
    onChange(updated)
  }

  // Categories metadata with user-friendly descriptions and security lock markers
  const emailRows = [
    { key: 'security', label: 'Security Alerts', desc: 'New login attempts, credential changes, and suspends.', locked: true },
    { key: 'authentication', label: 'Authentication', desc: 'Login OTPs and account verification codes.', locked: false },
    { key: 'payment', label: 'Payment Receipts', desc: 'Invoice confirmations, premium activation logs.', locked: false },
    { key: 'verification', label: 'Verification Alerts', desc: 'Status checks on profile approval and KYC logs.', locked: false },
    { key: 'associate', label: 'Matchmaker Associate', desc: 'Updates from your dedicated matching advisor.', locked: false },
    { key: 'support', label: 'Customer Support', desc: 'Ticket creation, update logs, and status locks.', locked: false },
    { key: 'marketing', label: 'Marketing Offers', desc: 'Discount alerts, promotional premiums updates.', locked: false },
    { key: 'newsletter', label: 'Newsletter digests', desc: 'Matrimonial tips and stories roundup.', locked: false },
    { key: 'blog', label: 'Blog Alerts', desc: 'Articles on relationships and marriage.', locked: false },
  ]

  const smsRows = [
    { key: 'security', label: 'Security Warnings', desc: 'Critical password modifications or device logins.', locked: true },
    { key: 'payment', label: 'Billing Texts', desc: 'Payment receipt success text summaries.', locked: false },
    { key: 'verification', label: 'KYC Status', desc: 'Status notifications on photo/doc checks.', locked: false },
    { key: 'associate', label: 'Advisor Alerts', desc: 'Urgent prompts from matchmaker advisors.', locked: false },
    { key: 'meetingReminder', label: 'Meeting Reminders', desc: 'Calendar warnings on schedules.', locked: false },
  ]

  const whatsappRows = [
    { key: 'otp', label: 'WhatsApp OTPs', desc: 'High-priority OTP codes for login/register.', locked: true },
    { key: 'payment', label: 'Billing Alerts', desc: 'PDF invoices, payment activation links.', locked: false },
    { key: 'associate', label: 'Advisor Shared Matches', desc: 'Instant profile cards recommendation cards.', locked: false },
    { key: 'meeting', label: 'Meeting Scheduled', desc: 'Date and time confirmations.', locked: false },
    { key: 'support', label: 'Ticket Updates', desc: 'Resolution warnings and closed confirmations.', locked: false },
    { key: 'marketing', label: 'Promo Offers', desc: 'Personalized premium discounts.', locked: false },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detailed Preferences Matrix</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Fine-tune what categories of messages are allowed on each communication channel.
        </p>
      </div>

      {/* EMAIL CATEGORIES */}
      {preferences.emailEnabled && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Email Delivery Preferences
          </h4>
          <div className="border border-gray-100 rounded-xl overflow-hidden dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {emailRows.map((row) => (
                <div key={row.key} className="flex items-center justify-between p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                  <div className="space-y-0.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{row.label}</span>
                      {row.locked && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          MANDATORY
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{row.desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={(preferences.categories.email as any)[row.key]}
                    disabled={row.locked}
                    onChange={(e) => updateCategory('email', row.key, e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer dark:border-gray-700 dark:bg-gray-800 disabled:opacity-55"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SMS CATEGORIES */}
      {preferences.smsEnabled && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            SMS Delivery Preferences
          </h4>
          <div className="border border-gray-100 rounded-xl overflow-hidden dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {smsRows.map((row) => (
                <div key={row.key} className="flex items-center justify-between p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                  <div className="space-y-0.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{row.label}</span>
                      {row.locked && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          MANDATORY
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{row.desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={(preferences.categories.sms as any)[row.key]}
                    disabled={row.locked}
                    onChange={(e) => updateCategory('sms', row.key, e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer dark:border-gray-700 dark:bg-gray-800 disabled:opacity-55"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP CATEGORIES */}
      {preferences.whatsappEnabled && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            WhatsApp Delivery Preferences
          </h4>
          <div className="border border-gray-100 rounded-xl overflow-hidden dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {whatsappRows.map((row) => (
                <div key={row.key} className="flex items-center justify-between p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                  <div className="space-y-0.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{row.label}</span>
                      {row.locked && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          MANDATORY
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{row.desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={(preferences.categories.whatsapp as any)[row.key]}
                    disabled={row.locked}
                    onChange={(e) => updateCategory('whatsapp', row.key, e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer dark:border-gray-700 dark:bg-gray-800 disabled:opacity-55"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
