'use client'
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Briefcase,
  Users,
  Wallet,
  Share2,
  Star,
  Heart,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

export function AssociateSidebar({
  role = 'local_associate',
  fullName = 'Associate Profile',
  avatarUrl = '',
}: {
  role?: string
  fullName?: string
  avatarUrl?: string
}) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const items: SidebarItem[] = [
    { name: 'Dashboard', href: '/associate/dashboard', icon: Layers },
    { name: 'My Cases', href: '/associate/cases', icon: Briefcase },
    { name: 'My Clients', href: '/associate/clients', icon: Users },
  ]

  if (role !== 'local_associate') {
    items.push({ name: 'My Team', href: '/associate/team', icon: Users })
  }
  items.push(
    { name: 'Wallet & Payouts', href: '/associate/wallet', icon: Wallet },
    { name: 'Referral Hub', href: '/associate/referrals', icon: Share2 },
    { name: 'Reviews & Feedback', href: '/associate/reviews', icon: Star },
    { name: 'Marriage Gallery', href: '/associate/marriages', icon: Heart },
    { name: 'Performance Analytics', href: '/associate/analytics', icon: BarChart3 },
    { name: 'My Profile & KYC', href: '/associate/profile', icon: User }
  )

  const formatRole = (roleStr: string) => {
    return roleStr.replace('_', ' ').toUpperCase()
  }

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full bg-slate-950 text-slate-100 border-r border-slate-800 transition-all duration-300 ease-in-out shadow-2xl z-20',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-20 px-4 border-b border-slate-800">
        {!collapsed && (
          <Link href="/associate/dashboard" className="flex items-center">
            <img
              src="/images/logo.png"
              alt="RishtaJoro"
              className="h-10 w-auto object-contain"
            />
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
            <span className="text-xs font-bold text-rose-500">RJ</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-300 hover:text-white transition shadow-lg cursor-pointer"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* User Info Card */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-10 h-10 rounded-full border-2 border-pink-500/50 object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-inner">
                {fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-white">{fullName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Shield size={12} className="text-pink-400" />
                <span className="text-[10px] font-bold text-slate-400 tracking-wider truncate">
                  {formatRole(role)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                isActive
                  ? 'bg-gradient-to-r from-rose-500/10 to-violet-500/10 text-rose-400 border-l-4 border-rose-500 font-semibold shadow-inner'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 border-l-4 border-transparent'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110',
                  isActive ? 'text-rose-400' : 'text-slate-400 group-hover:text-slate-100'
                )}
              />
              {!collapsed && <span className="truncate">{item.name}</span>}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-xs rounded opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none whitespace-nowrap shadow-xl border border-slate-800 z-30">
                  {item.name}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-900 text-center">
          <p className="text-[10px] text-slate-500">Rishtajodo CRM v2.0</p>
        </div>
      )}
    </aside>
  )
}
