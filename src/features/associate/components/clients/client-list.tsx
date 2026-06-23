'use client'
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect } from 'react'
import { getAssignedClients } from '@/features/associate/actions/client-actions'
import { Search, MapPin, User, ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export function ClientList() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    setLoading(true)
    const res = await getAssignedClients()
    if (res.success && res.data) {
      setClients(res.data)
    }
    setLoading(false)
  }

  const filteredClients = clients.filter((c) => {
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase()
    const cityState = `${c.city || ''} ${c.state || ''}`.toLowerCase()
    return fullName.includes(search.toLowerCase()) || cityState.includes(search.toLowerCase())
  })

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
          My Assigned Clients
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your personal matchmaking client portfolio.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by client name, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
          <User className="text-gray-300 w-12 h-12 mb-3" />
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">No Clients Assigned</p>
          <p className="text-xs text-gray-400 mt-1">Clients will appear here once assigned to you by administrators.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const clientName = `${client.first_name} ${client.last_name}`
            const hasCase = !!client.active_case

            return (
              <div
                key={client.id}
                className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    {client.avatar_url ? (
                      <img
                        src={client.avatar_url}
                        alt={clientName}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-800"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center font-black text-white shadow-inner">
                        {client.first_name[0]}{client.last_name[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-gray-800 dark:text-white truncate">
                          {clientName}
                        </h4>
                        {client.is_premium && (
                          <span title="Premium subscription">
                            <ShieldCheck size={16} className="text-amber-500 shrink-0" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} />
                        {client.city}, {client.state}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 py-3 border-t border-b border-gray-100 dark:border-gray-900 text-xs text-gray-500 dark:text-gray-400">
                    <div>
                      <p className="font-bold uppercase tracking-wider text-[9px] text-gray-400">Religion/Caste</p>
                      <p className="mt-0.5 font-semibold text-gray-700 dark:text-gray-300">
                        {client.religion || 'N/A'} {client.caste ? `/ ${client.caste}` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="font-bold uppercase tracking-wider text-[9px] text-gray-400">Matchmaking Case</p>
                      {hasCase ? (
                        <p className="mt-0.5 font-bold text-pink-500 uppercase tracking-wider text-[10px]">
                          {client.active_case.status.replace('_', ' ')}
                        </p>
                      ) : (
                        <p className="mt-0.5 font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                          NO ACTIVE CASE
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Link
                    href={`/associate/clients/${client.id}`}
                    className="flex-1 text-center py-2 px-3 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 transition cursor-pointer"
                  >
                    View Details
                  </Link>
                  {hasCase && (
                    <Link
                      href={`/associate/cases/${client.active_case.id}`}
                      className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow transition cursor-pointer"
                    >
                      Workspace <ArrowRight size={12} />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
