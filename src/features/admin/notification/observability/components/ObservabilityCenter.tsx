'use client'

// ============================================================
// MAIN OBSERVABILITY SWITCHER — Phase 10
// Hosts all telemetry tabs: Executive dashboards, charts,
// queue monitors, alerts log, cost meters, reports compiler.
// ============================================================

import React, { useState } from 'react'
import {
  Activity,
  BarChart3,
  Layers,
  Inbox,
  AlertOctagon,
  DollarSign,
  TrendingUp,
  HeartPulse,
  History,
  FileCode,
} from 'lucide-react'
import ExecutiveDashboard from './ExecutiveDashboard'
import AnalyticsDashboard from './AnalyticsDashboard'
import ProviderDashboard from './ProviderDashboard'
import QueueMonitor from './QueueMonitor'
import AlertCenter from './AlertCenter'
import CostDashboard from './CostDashboard'
import ForecastDashboard from './ForecastDashboard'
import HealthDashboard from './HealthDashboard'
import AuditDashboard from './AuditDashboard'
import ReportCenter from './ReportCenter'

type ObservabilityTab =
  | 'executive'
  | 'analytics'
  | 'providers'
  | 'queue'
  | 'alerts'
  | 'cost'
  | 'forecast'
  | 'health'
  | 'audit'
  | 'reports'

interface NavigationItem {
  id: ObservabilityTab
  label: string
  icon: React.ElementType
}

const navItems: NavigationItem[] = [
  { id: 'executive', label: 'Executive Metrics', icon: Activity },
  { id: 'analytics', label: 'Outbound Charts',  icon: BarChart3 },
  { id: 'providers', label: 'Provider Latency', icon: Layers },
  { id: 'queue',     label: 'Queue Stats',     icon: Inbox },
  { id: 'alerts',    label: 'Incident Manager', icon: AlertOctagon },
  { id: 'cost',      label: 'Cost Observability', icon: DollarSign },
  { id: 'forecast',  label: 'Predictive Projections', icon: TrendingUp },
  { id: 'health',    label: 'System Diagnostics', icon: HeartPulse },
  { id: 'audit',     label: 'Audit Log Trail',  icon: History },
  { id: 'reports',   label: 'Report Compiler',  icon: FileCode },
]

export default function ObservabilityCenter() {
  const [activeSubTab, setActiveSubTab] = useState<ObservabilityTab>('executive')

  return (
    <div className="flex flex-col lg:flex-row min-h-[500px] gap-6 -m-4">
      {/* Sub tabs sidebar selector */}
      <div className="w-full lg:w-56 bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-900 rounded-2xl p-3 space-y-0.5 shrink-0 h-fit">
        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block px-3 py-1 mb-2 select-none">
          Telemetry Scopes
        </span>
        
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSubTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSubTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition text-left ${
                isActive
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 font-bold'
                  : 'text-gray-650 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-rose-500' : 'text-gray-450'} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Observability View Container */}
      <div className="flex-1 min-w-0">
        {activeSubTab === 'executive' && <ExecutiveDashboard />}
        {activeSubTab === 'analytics' && <AnalyticsDashboard />}
        {activeSubTab === 'providers' && <ProviderDashboard />}
        {activeSubTab === 'queue' && <QueueMonitor />}
        {activeSubTab === 'alerts' && <AlertCenter />}
        {activeSubTab === 'cost' && <CostDashboard />}
        {activeSubTab === 'forecast' && <ForecastDashboard />}
        {activeSubTab === 'health' && <HealthDashboard />}
        {activeSubTab === 'audit' && <AuditDashboard />}
        {activeSubTab === 'reports' && <ReportCenter />}
      </div>
    </div>
  )
}
