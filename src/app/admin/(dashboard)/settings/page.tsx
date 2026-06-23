'use client'

import React, { useState } from 'react'
import { ShieldCheck, ToggleLeft } from 'lucide-react'
import { FeatureFlagsManager } from '@/features/admin/components/settings/feature-flags-manager'

const ROLES_MATRIX = [
  { role: 'Super Administrator', code: 'super_admin', perms: 'All operational permissions' },
  { role: 'General Administrator', code: 'admin', perms: 'Users, Associates, Verifications, Cases, Content, Notifications' },
  { role: 'Verification Manager', code: 'verification_manager', perms: 'KYC Document Verifications, Disputes reviews, Performance logs' },
  { role: 'Verification Operator', code: 'verification_executive', perms: 'Daily user and associate KYC document processing' },
  { role: 'Support Team Lead', code: 'support_manager', perms: 'Disputes resolution, User suspension toggles, Broadcasts push alerts' },
  { role: 'Support Agent', code: 'support_executive', perms: 'Daily user tickets and associate dispute audits' },
  { role: 'Finance Department Manager', code: 'finance_manager', perms: 'Revenue insights, Payouts settlement approvals, Refunds processed' },
  { role: 'Finance Agent', code: 'finance_executive', perms: 'Gateway payments audit trails logs, wallet ledgers checks' },
  { role: 'Associate Relations Lead', code: 'associate_manager', perms: 'Associate onboarding approvals, Case owners assignments' },
  { role: 'CMS Content Curator', code: 'content_manager', perms: 'Homepage dynamic sections editor, blogs writer, SEO meta controls' },
  { role: 'Community Moderator', code: 'moderator', perms: 'Flagged profile reviews, Anti-fraud checks' },
  { role: 'Business Analytics Analyst', code: 'analytics_manager', perms: 'Revenue ingress and subscription conversion sparklines' },
]

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'rbac' | 'flags'>('rbac')

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
          System Configuration & RBAC
        </h1>
        <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-wider">
          Manage system-level settings, authorization rules, and feature flags.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-250/50 dark:border-gray-850 pb-px text-xs font-bold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab('rbac')}
          className={`pb-3 px-1 transition relative border-b-2 cursor-pointer ${
            activeTab === 'rbac'
              ? 'text-pink-500 border-pink-500'
              : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-transparent'
          }`}
        >
          RBAC Privilege Matrix
        </button>
        <button
          onClick={() => setActiveTab('flags')}
          className={`pb-3 px-1 transition relative border-b-2 cursor-pointer ${
            activeTab === 'flags'
              ? 'text-pink-500 border-pink-500'
              : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-transparent'
          }`}
        >
          Feature Toggles
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm">
          {activeTab === 'rbac' ? (
            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-100 dark:border-gray-900 pb-3 flex items-center gap-2">
                <ShieldCheck size={16} className="text-pink-500" /> Active Privilege Levels Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {ROLES_MATRIX.map((r, idx) => (
                  <div key={idx} className="p-4 border border-gray-100 dark:border-gray-900 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800 dark:text-gray-200">{r.role}</span>
                      <span className="px-1.5 py-0.5 bg-pink-500/10 text-pink-500 font-bold uppercase tracking-wider text-[8px] rounded">
                        {r.code}
                      </span>
                    </div>
                    <p className="text-gray-500 font-medium text-[10px]">{r.perms}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-100 dark:border-gray-900 pb-3 flex items-center gap-2">
                <ToggleLeft size={16} className="text-pink-500" /> Feature Flags Configuration
              </h3>
              <FeatureFlagsManager />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
