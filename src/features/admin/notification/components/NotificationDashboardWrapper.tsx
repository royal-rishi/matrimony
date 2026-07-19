'use client'

// ============================================================
// MAIN ADMIN OPERATIONS CENTER WRAPPER — WITH URL-DRIVEN TABS
// ============================================================

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { NotificationSidebar, NavTab } from './NotificationSidebar'
import { NotificationDashboard } from './NotificationDashboard'
import { TemplateEditor } from './TemplateEditor'
import { CampaignWizard } from './CampaignWizard'
import { QueueViewer } from './QueueViewer'
import { DLQViewer } from './DLQViewer'
import { ProviderStatus } from './ProviderStatus'
import { LogViewer } from './LogViewer'
import { AnalyticsPanel } from './AnalyticsPanel'
import { NotificationSettingsPanel } from './NotificationSettingsPanel'
import { ObservabilityCenter } from '../observability/components'
import ProductionDashboard from '../production/components/ProductionDashboard'

interface NotificationDashboardWrapperProps {
  defaultTab?: NavTab
}

export const NotificationDashboardWrapper: React.FC<NotificationDashboardWrapperProps> = ({
  defaultTab = 'dashboard',
}) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabFromUrl = (searchParams.get('tab') as NavTab) || defaultTab
  const [activeTab, setActiveTab] = useState<NavTab>(tabFromUrl)

  // Keep URL in sync with tab
  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab)
    router.push(`/admin/notifications?tab=${tab}`, { scroll: false })
  }

  // Sync tab from URL changes (e.g. browser back/forward)
  useEffect(() => {
    setActiveTab(tabFromUrl)
  }, [tabFromUrl])

  const tabTitles: Record<NavTab, { title: string; description: string }> = {
    dashboard:      { title: 'Control Panel Overview',    description: 'Real-time telemetry, channel distribution, and system alerts.' },
    templates:      { title: 'Message Templates Registry', description: 'Manage transactional and marketing alert templates across all channels.' },
    campaigns:      { title: 'Broadcast Campaign Manager', description: 'Configure segmented campaigns and dispatch bulk notifications.' },
    queues:         { title: 'Queue Monitor & DLQ Center', description: 'Active pending jobs and dead-lettered failure retries.' },
    analytics:      { title: 'Notification Analytics',    description: 'Delivery rates, open rates, cost trends, and channel comparisons.' },
    logs:           { title: 'Delivery Audit Logs',        description: 'Searchable full audit trail with CSV export.' },
    providers:      { title: 'Provider Health Status',     description: 'Live gateway pings, latency reports, and health indicators.' },
    settings:       { title: 'Notification Settings',      description: 'Provider priority, retry config, rate limits, and global quiet hours.' },
    observability:  { title: 'Observability & Monitoring', description: 'Enterprise telemetry center: full metrics, alerts, health, and forecasts.' },
    production:     { title: 'Production Readiness & DevSecOps', description: 'OWASP security audits, chaos testing triggers, load testers, and go-live readiness.' },
  }

  const current = tabTitles[activeTab]

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-gray-50/40 dark:bg-gray-900/10 -m-6">
      {/* Left Sidebar */}
      <NotificationSidebar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto min-w-0">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-gray-200 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-full">
                Admin Portal
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-600">/</span>
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Notifications
              </span>
            </div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              {current.title}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {current.description}
            </p>
          </div>

          {/* Quick action badges */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
              All Systems Operational
            </span>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'dashboard' && <NotificationDashboard />}
          {activeTab === 'templates' && <TemplateEditor />}
          {activeTab === 'campaigns' && <CampaignWizard />}
          {activeTab === 'queues' && (
            <div className="space-y-8">
              <QueueViewer />
              <DLQViewer />
            </div>
          )}
          {activeTab === 'analytics' && <AnalyticsPanel />}
          {activeTab === 'logs' && <LogViewer />}
          {activeTab === 'providers' && <ProviderStatus />}
          {activeTab === 'settings' && <NotificationSettingsPanel />}
          {activeTab === 'observability' && <ObservabilityCenter />}
          {activeTab === 'production' && <ProductionDashboard />}
        </div>
      </main>
    </div>
  )
}
