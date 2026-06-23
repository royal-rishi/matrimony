'use client'
/* eslint-disable @next/next/no-img-element */

import React from 'react'
import { Check, X } from 'lucide-react'

export function ReferralList({ referrals }: { referrals: any[] }) {
  const getStatusIndicator = (status: boolean) => {
    return status ? (
      <span className="p-0.5 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40">
        <Check size={12} className="stroke-[3.5]" />
      </span>
    ) : (
      <span className="p-0.5 rounded-full bg-gray-100 text-gray-400 dark:bg-gray-900">
        <X size={12} className="stroke-[3]" />
      </span>
    )
  }

  if (referrals.length === 0) {
    return <p className="text-xs text-gray-500 text-center py-6">No referrals recorded yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-900 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <th className="pb-3">Referred User</th>
            <th className="pb-3 text-center">Registered</th>
            <th className="pb-3 text-center">Verified</th>
            <th className="pb-3 text-center">Premium</th>
            <th className="pb-3 text-center">Matchmaking</th>
            <th className="pb-3 text-center">Married</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-900 text-xs">
          {referrals.map((ref) => {
            const pName = ref.referred_profile
              ? `${ref.referred_profile.first_name} ${ref.referred_profile.last_name}`
              : ref.referred_email
            return (
              <tr key={ref.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10">
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    {ref.referred_profile?.avatar_url && (
                      <img
                        src={ref.referred_profile.avatar_url}
                        alt={pName}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    )}
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      {pName}
                    </span>
                  </div>
                </td>
                <td className="py-4 text-center">
                  <div className="flex justify-center">{getStatusIndicator(!!ref.referred_user_id || !!ref.registered_at)}</div>
                </td>
                <td className="py-4 text-center">
                  <div className="flex justify-center">{getStatusIndicator(!!ref.verified_at)}</div>
                </td>
                <td className="py-4 text-center">
                  <div className="flex justify-center">{getStatusIndicator(!!ref.premium_at)}</div>
                </td>
                <td className="py-4 text-center">
                  <div className="flex justify-center">{getStatusIndicator(!!ref.matchmaking_plan_at)}</div>
                </td>
                <td className="py-4 text-center">
                  <div className="flex justify-center">{getStatusIndicator(!!ref.married_at)}</div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
