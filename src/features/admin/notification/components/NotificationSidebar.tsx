'use client'

// ============================================================
// ADMIN NOTIFICATION SIDEBAR — EXTENDED WITH ANALYTICS & SETTINGS
// ============================================================

import React from 'react'
import {
  BarChart3,
  Bell,
  FileText,
  Megaphone,
  Activity,
  ScrollText,
  Zap,
  Settings,
  Inbox,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type NavTab =
  | 'dashboard'
  | 'templates'
  | 'campaigns'
  | 'queues'
  | 'analytics'
  | 'logs'
  | 'providers'
  | 'settings'
  | 'observability'
  | 'production'

interface NotificationSidebarProps {
  activeTab: NavTab
  onTabChange: (tab: NavTab) => void
}

interface NavItem {
  id: NavTab
  label: string
  icon: React.ElementType
  badge?: string
}

const menuItems: NavItem[] = [
  { id: 'dashboard',      label: 'Control Panel',       icon: Bell },
  { id: 'templates',      label: 'Message Templates',    icon: FileText },
  { id: 'campaigns',      label: 'Broadcast Wizard',     icon: Megaphone },
  { id: 'queues',         label: 'Queue & DLQ Monitor',  icon: Inbox },
  { id: 'analytics',      label: 'Analytics',            icon: BarChart3 },
  { id: 'logs',           label: 'Delivery Logs',        icon: ScrollText },
  { id: 'providers',      label: 'Provider Health',      icon: Zap },
  { id: 'settings',       label: 'Settings',             icon: Settings },
  { id: 'observability',  label: 'Observability Hub',    icon: Activity },
  { id: 'production',     label: 'Production Readiness',  icon: ShieldAlert },
]

export const NotificationSidebar: React.FC<NotificationSidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <aside className="w-full md:w-60 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-900">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10">
            <Activity size={14} className="text-rose-500" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest block">Admin</span>
            <span className="text-xs font-black text-gray-900 dark:text-white leading-none">Notifications Ops</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer text-left',
                isActive
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white'
              )}
            >
              <Icon
                size={15}
                className={cn(
                  'shrink-0',
                  isActive ? 'text-rose-500' : 'text-gray-400 group-hover:text-gray-600'
                )}
              />
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-900">
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-xl">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">MSG91 Gateways</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">SMS · Email · WhatsApp</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
