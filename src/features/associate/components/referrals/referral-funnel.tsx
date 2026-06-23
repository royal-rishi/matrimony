'use client'

import React from 'react'

export function ReferralFunnel({ stats }: { stats: any }) {
  const steps = [
    { label: 'Registrations', value: stats?.registered || 0, color: '#3b82f6', width: 'w-full' },
    { label: 'Verified Profiles', value: stats?.verified || 0, color: '#6366f1', width: 'w-5/6' },
    { label: 'Premium Members', value: stats?.premium || 0, color: '#f59e0b', width: 'w-4/6' },
    { label: 'Matchmaking Clients', value: stats?.personal_matchmaking || 0, color: '#a855f7', width: 'w-3/6' },
    { label: 'Married Milestones', value: stats?.married || 0, color: '#10b981', width: 'w-2/6' },
  ]

  // Calculate percentages relative to registrations
  const total = stats?.registered || 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        {/* Inline custom CSS SVG funnel */}
        <div className="w-full max-w-md mx-auto space-y-4">
          {steps.map((step, index) => {
            const percentage = index === 0 ? 100 : Math.round((step.value / total) * 100)
            return (
              <div key={index} className="flex items-center gap-4">
                <span className="w-32 text-xs font-bold text-gray-500 dark:text-gray-400 text-right truncate">
                  {step.label}
                </span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden h-9 relative">
                  <div
                    style={{
                      width: `${Math.max(percentage, 5)}%`,
                      backgroundColor: step.color,
                    }}
                    className="h-full rounded-r-xl transition-all duration-500 flex items-center justify-between px-3 text-white font-extrabold text-xs shadow-inner"
                  >
                    <span>{step.value}</span>
                    {percentage > 15 && <span>{percentage}%</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
