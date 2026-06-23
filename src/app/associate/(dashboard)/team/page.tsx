'use client'
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Shield, MapPin } from 'lucide-react'

export default function TeamPage() {
  const [subordinates, setSubordinates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadTeamData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch associates where parent_associate_id is this user.id
      const { data, error } = await supabase
        .from('associates')
        .select(`
          id,
          status,
          wallet_balance,
          profile:profiles!associates_id_fkey(
            first_name,
            last_name,
            role,
            avatar_url,
            city,
            state
          )
        `)
        .eq('parent_associate_id', user.id)

      if (error) throw error

      // Enrich with case statistics
      const enriched = await Promise.all(
        (data || []).map(async (item: any) => {
          const { count: activeCases } = await supabase
            .from('associate_cases')
            .select('*', { count: 'exact', head: true })
            .eq('associate_id', item.id)
            .neq('status', 'closed')

          const { count: completions } = await supabase
            .from('marriage_successes')
            .select('*', { count: 'exact', head: true })
            .eq('associate_id', item.id)

          return {
            ...item,
            activeCases: activeCases || 0,
            completions: completions || 0,
          }
        })
      )

      setSubordinates(enriched)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadTeamData()
  }, [loadTeamData])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
          Associate Network Team
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Monitor performance metrics for subordinate local matchmakers assigned to your territory.
        </p>
      </div>

      {subordinates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950">
          <Users className="text-gray-300 w-12 h-12 mb-3" />
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">No Subordinate Associates</p>
          <p className="text-xs text-gray-400 mt-1">You are currently at the base level or have no subordinate associates assigned.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subordinates.map((item) => {
            const name = item.profile ? `${item.profile.first_name} ${item.profile.last_name}` : 'Local Matchmaker'
            const role = item.profile?.role?.replace('_', ' ').toUpperCase() || 'LOCAL ASSOCIATE'

            return (
              <div
                key={item.id}
                className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    {item.profile?.avatar_url ? (
                      <img
                        src={item.profile.avatar_url}
                        alt={name}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center font-black text-white shadow-inner">
                        {item.profile?.first_name[0]}{item.profile?.last_name[0]}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-white truncate">
                        {name}
                      </h4>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={12} />
                        {item.profile?.city || 'Unknown'}, {item.profile?.state || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 py-3 border-t border-b border-gray-100 dark:border-gray-900 text-xs text-gray-500 dark:text-gray-400">
                    <div>
                      <p className="font-bold uppercase tracking-wider text-[9px] text-gray-400">Active Cases</p>
                      <p className="mt-0.5 font-bold text-gray-800 dark:text-gray-200">
                        {item.activeCases} cases
                      </p>
                    </div>
                    <div>
                      <p className="font-bold uppercase tracking-wider text-[9px] text-gray-400">Verified Marriages</p>
                      <p className="mt-0.5 font-bold text-gray-800 dark:text-gray-200">
                        {item.completions} successes
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                    <Shield size={12} className="text-pink-500" />
                    {role}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                    {item.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
