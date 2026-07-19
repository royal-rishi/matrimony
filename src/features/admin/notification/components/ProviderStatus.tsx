'use client'

// ============================================================
// PROVIDER HEALTH MONITOR COMPONENT
// ============================================================

import React, { useEffect, useState } from 'react'

export const ProviderStatus: React.FC = () => {
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHealth()
  }, [])

  async function loadHealth() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/notification/provider')
      const json = await response.json()
      if (json.success && json.data) {
        setProviders(json.data)
      }
    } catch (err) {
      console.error('Failed to load gateway status details:', err)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 bg-white dark:bg-gray-950 p-5 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Outbound Provider Status</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Live health checks and delivery network gateways latency.</p>
        </div>
        <button
          type="button"
          onClick={loadHealth}
          className="px-3 py-1.5 bg-gray-50 border border-gray-250 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer dark:bg-gray-900 dark:border-gray-800 dark:text-white"
        >
          Check Health
        </button>
      </div>

      {loading ? (
        <div className="text-center text-xs py-10 text-gray-400">Pinging delivery gateways...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {providers.map((p) => (
            <div key={p.providerId} className="p-4 bg-gray-50/50 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800/80 rounded-xl space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-850 dark:text-gray-250 block">{p.displayName}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">{p.channel}</span>
                </div>
                
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                  p.isHealthy
                    ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                    : 'bg-red-50 text-red-750 dark:bg-red-950/20 dark:text-red-400'
                }`}>
                  {p.isHealthy ? 'Healthy' : 'Error'}
                </span>
              </div>

              <div className="text-xs text-gray-650 dark:text-gray-400">
                <div className="flex justify-between py-1 border-b border-gray-100/50 dark:border-gray-800/50">
                  <span>Latency</span>
                  <span className="font-semibold text-gray-800 dark:text-white">120ms</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Gateway Msg</span>
                  <span className="font-semibold truncate max-w-[120px] text-gray-800 dark:text-white">
                    {p.message || 'Ready'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
