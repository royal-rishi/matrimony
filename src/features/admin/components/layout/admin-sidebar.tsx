'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  ShieldCheck,
  ClipboardList,
  CreditCard,
  Percent,
  AlertTriangle,
  Flame,
  Heart,
  Globe,
  FileCode,
  Settings,
  Menu,
  ChevronLeft,
  BarChart3,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarItem {
  label: string
  href: string
  icon: any
  permission?: string
}

export function AdminSidebar({
  roleName = 'Administrator',
  permissions = [],
}: {
  roleName?: string
  permissions?: string[]
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)

  const items: SidebarItem[] = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Analytics Center', href: '/admin/analytics', icon: BarChart3, permission: 'manage_analytics' },
    { label: 'Users Manager', href: '/admin/users', icon: Users, permission: 'manage_users' },
    { label: 'Associates Hub', href: '/admin/associates', icon: Briefcase, permission: 'manage_associates' },
    { label: 'Verification Center', href: '/admin/verifications', icon: ShieldCheck, permission: 'manage_verifications' },
    { label: 'Cases CRM', href: '/admin/cases', icon: ClipboardList, permission: 'manage_cases' },
    { label: 'Payments Finance', href: '/admin/payments', icon: CreditCard, permission: 'manage_payments' },
    { label: 'Commissions', href: '/admin/commissions', icon: Percent, permission: 'manage_commissions' },
    { label: 'Disputes Center', href: '/admin/disputes', icon: AlertTriangle, permission: 'manage_disputes' },
    { label: 'Fraud Detection', href: '/admin/fraud', icon: Flame, permission: 'manage_fraud' },
    { label: 'Marriage Stories', href: '/admin/marriages', icon: Heart, permission: 'manage_marriages' },
    { label: 'Content CMS', href: '/admin/content', icon: Globe, permission: 'manage_content' },
    { label: 'Notifications Hub', href: '/admin/notifications', icon: Bell, permission: 'manage_notifications' },
    { label: 'System Audit Logs', href: '/admin/audit-logs', icon: FileCode, permission: 'manage_audit_logs' },
    { label: 'RBAC Settings', href: '/admin/settings', icon: Settings, permission: 'manage_settings' },
  ]

  // Filter items based on permissions
  const filteredItems = items.filter((item) => {
    if (permissions.includes('*')) return true
    if (!item.permission) return true
    return permissions.includes(item.permission)
  })

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-slate-950 text-slate-100 border-r border-slate-900 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-900">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-pink-500/20">
              RJ
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white">RishtaJoro</span>
              <span className="block text-[9px] font-black uppercase text-pink-500 tracking-widest leading-none mt-0.5">
                Staff Ops
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center font-black text-white text-xs mx-auto">
            RJ
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg cursor-pointer transition hidden md:block"
        >
          {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {filteredItems.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition group cursor-pointer',
                active
                  ? 'bg-gradient-to-r from-pink-500/10 to-rose-500/5 text-pink-400 border-l-2 border-pink-500'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              )}
            >
              <Icon
                size={16}
                className={cn(
                  'shrink-0 transition-transform group-hover:scale-105',
                  active ? 'text-pink-500' : 'text-slate-500 group-hover:text-slate-300'
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Staff profile footer */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white uppercase shadow-inner shrink-0">
            {roleName[0]}
          </div>
          {!collapsed && (
            <div className="truncate">
              <span className="block text-xs font-bold text-slate-200 truncate leading-tight">RishtaJoro Staff</span>
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate leading-none mt-1">
                {roleName.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
