'use client'

// ============================================================
// NOTIFICATION SETTINGS PANEL
// ============================================================

import React, { useState } from 'react'
import { toast } from 'sonner'
import { Save, Shield, Clock, RefreshCw, Sliders, AlertTriangle } from 'lucide-react'

interface SettingsState {
  // Provider priority
  primarySmsProvider: 'msg91' | 'mock'
  primaryEmailProvider: 'msg91' | 'mock'
  primaryWhatsappProvider: 'msg91' | 'mock'

  // Retry config
  maxRetryAttempts: number
  retryBackoffSeconds: number
  retryOnFailureCodes: string

  // Rate limits
  maxPerUserPerMinute: number
  maxPerUserPerHour: number
  maxGlobalPerMinute: number

  // Global quiet hours
  globalQuietEnabled: boolean
  globalQuietStart: string
  globalQuietEnd: string
  globalQuietTimezone: string

  // Emergency override
  emergencyOverride: boolean
  emergencyBypassChannels: string[]

  // Dedup window
  dedupWindowSeconds: number
}

const DEFAULT_SETTINGS: SettingsState = {
  primarySmsProvider: 'msg91',
  primaryEmailProvider: 'msg91',
  primaryWhatsappProvider: 'msg91',
  maxRetryAttempts: 5,
  retryBackoffSeconds: 30,
  retryOnFailureCodes: '429,503,504',
  maxPerUserPerMinute: 20,
  maxPerUserPerHour: 100,
  maxGlobalPerMinute: 5000,
  globalQuietEnabled: false,
  globalQuietStart: '22:00',
  globalQuietEnd: '08:00',
  globalQuietTimezone: 'Asia/Kolkata',
  emergencyOverride: false,
  emergencyBypassChannels: ['sms', 'whatsapp'],
  dedupWindowSeconds: 10,
}

export const NotificationSettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<'provider' | 'retry' | 'ratelimit' | 'quiet' | 'emergency'>('provider')

  const handleSave = async () => {
    setSaving(true)
    // In production, persist to DB or env config via server action
    await new Promise((r) => setTimeout(r, 800))
    toast.success('Notification settings saved successfully.')
    setSaving(false)
  }

  const sectionNav = [
    { id: 'provider' as const, label: 'Provider Priority', icon: Sliders },
    { id: 'retry' as const, label: 'Retry Configuration', icon: RefreshCw },
    { id: 'ratelimit' as const, label: 'Rate Limits', icon: Shield },
    { id: 'quiet' as const, label: 'Global Quiet Hours', icon: Clock },
    { id: 'emergency' as const, label: 'Emergency Override', icon: AlertTriangle },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Global Notification Settings</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure provider priorities, retry policies, rate limits, and global quiet hours.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-600 disabled:opacity-50 cursor-pointer shadow-sm transition-all"
        >
          <Save size={13} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Section Nav */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm p-3 space-y-0.5 h-fit">
          {sectionNav.map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all text-left ${
                  activeSection === s.id
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900'
                }`}
              >
                <Icon size={13} className={activeSection === s.id ? 'text-rose-500' : 'text-gray-400'} />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* Settings Form */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm p-6 space-y-6">
          {/* Provider Priority */}
          {activeSection === 'provider' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Primary Provider Priority</h3>
                <p className="text-xs text-gray-500 mt-0.5">Select which gateway each channel routes through first.</p>
              </div>

              {[
                { label: 'SMS Provider', key: 'primarySmsProvider' as const },
                { label: 'Email Provider', key: 'primaryEmailProvider' as const },
                { label: 'WhatsApp Provider', key: 'primaryWhatsappProvider' as const },
              ].map((field) => (
                <div key={field.key} className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{field.label}</span>
                    <p className="text-xs text-gray-500">Primary routing gateway for this channel.</p>
                  </div>
                  <select
                    value={settings[field.key]}
                    onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
                  >
                    <option value="msg91">MSG91 (Production)</option>
                    <option value="mock">Mock Provider (Testing)</option>
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Retry Configuration */}
          {activeSection === 'retry' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Retry Configuration</h3>
                <p className="text-xs text-gray-500 mt-0.5">Configure automatic retry behaviour for failed deliveries.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Max Retry Attempts</label>
                  <input
                    type="number"
                    min={1} max={10}
                    value={settings.maxRetryAttempts}
                    onChange={(e) => setSettings({ ...settings, maxRetryAttempts: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Backoff Interval (seconds)</label>
                  <input
                    type="number"
                    min={5}
                    value={settings.retryBackoffSeconds}
                    onChange={(e) => setSettings({ ...settings, retryBackoffSeconds: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Retry on HTTP Status Codes (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. 429,503,504"
                    value={settings.retryOnFailureCodes}
                    onChange={(e) => setSettings({ ...settings, retryOnFailureCodes: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Dedup Window (seconds)</label>
                  <input
                    type="number"
                    min={0}
                    value={settings.dedupWindowSeconds}
                    onChange={(e) => setSettings({ ...settings, dedupWindowSeconds: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
                  />
                  <p className="text-[10px] text-gray-400">Identical payloads within this window are suppressed.</p>
                </div>
              </div>
            </div>
          )}

          {/* Rate Limits */}
          {activeSection === 'ratelimit' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Rate Limits</h3>
                <p className="text-xs text-gray-500 mt-0.5">Throttle outbound notification volume per user and globally.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Max per User / Minute', key: 'maxPerUserPerMinute' as const },
                  { label: 'Max per User / Hour', key: 'maxPerUserPerHour' as const },
                  { label: 'Max Global / Minute', key: 'maxGlobalPerMinute' as const },
                ].map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">{field.label}</label>
                    <input
                      type="number"
                      min={1}
                      value={settings[field.key]}
                      onChange={(e) => setSettings({ ...settings, [field.key]: Number(e.target.value) })}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Global Quiet Hours */}
          {activeSection === 'quiet' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Global Quiet Hours</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Suppress SMS and WhatsApp for all users during these hours. Critical security alerts bypass this.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800">
                <div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Enable Global Quiet Hours</span>
                  <p className="text-xs text-gray-500">Applied platform-wide, overrides individual user settings.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.globalQuietEnabled}
                  onChange={(e) => setSettings({ ...settings, globalQuietEnabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
              </div>

              {settings.globalQuietEnabled && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Start Time (Quiet begins)</label>
                    <input
                      type="time"
                      value={settings.globalQuietStart}
                      onChange={(e) => setSettings({ ...settings, globalQuietStart: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">End Time (Quiet ends)</label>
                    <input
                      type="time"
                      value={settings.globalQuietEnd}
                      onChange={(e) => setSettings({ ...settings, globalQuietEnd: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Timezone</label>
                    <select
                      value={settings.globalQuietTimezone}
                      onChange={(e) => setSettings({ ...settings, globalQuietTimezone: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
                    >
                      <option value="Asia/Kolkata">IST — Asia/Kolkata</option>
                      <option value="UTC">UTC</option>
                      <option value="Asia/Dubai">GST — Asia/Dubai</option>
                      <option value="America/New_York">EST — America/New_York</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Emergency Override */}
          {activeSection === 'emergency' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Emergency Override</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  When active, all notifications bypass user quiet hours, frequency caps, and opt-out flags for critical dispatches.
                </p>
              </div>

              <div className="p-4 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/40 rounded-xl space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Emergency Broadcast Mode
                    </span>
                    <p className="text-xs text-rose-600/80 dark:text-rose-400/70 mt-1">
                      Activating this will override ALL user notification preferences for the selected channels. Use only during platform emergencies.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emergencyOverride}
                    onChange={(e) => setSettings({ ...settings, emergencyOverride: e.target.checked })}
                    className="w-5 h-5 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer shrink-0"
                  />
                </div>

                {settings.emergencyOverride && (
                  <div className="pt-2 border-t border-rose-200 dark:border-rose-900/40">
                    <label className="text-xs font-semibold text-rose-600 dark:text-rose-400 block mb-2">
                      Bypass channels (select all that apply):
                    </label>
                    <div className="flex gap-4">
                      {['sms', 'whatsapp', 'email', 'in_app'].map((ch) => (
                        <label key={ch} className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.emergencyBypassChannels.includes(ch)}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...settings.emergencyBypassChannels, ch]
                                : settings.emergencyBypassChannels.filter((c) => c !== ch)
                              setSettings({ ...settings, emergencyBypassChannels: updated })
                            }}
                            className="w-4 h-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                          />
                          {ch.toUpperCase()}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
