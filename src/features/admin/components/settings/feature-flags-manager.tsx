'use client'

import React, { useState, useEffect } from 'react'
import { getFeatureFlags, updateFeatureFlag } from '@/features/admin/actions/settings-actions'
import { toast } from 'sonner'
import { Check, X, ShieldAlert, AlertCircle, Loader2 } from 'lucide-react'

export function FeatureFlagsManager() {
  const [flags, setFlags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadFlags() {
      const res = await getFeatureFlags()
      if (res.success) {
        setFlags(res.data || [])
      } else {
        toast.error(res.error || 'Failed to load feature flags')
      }
      setLoading(false)
    }
    loadFlags()
  }, [])

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setTogglingId(id)
    const newStatus = !currentStatus
    const res = await updateFeatureFlag(id, newStatus)
    if (res.success) {
      setFlags((prev) =>
        prev.map((f) => (f.id === id ? { ...f, is_enabled: newStatus } : f))
      )
      toast.success(`Feature Flag '${id}' updated successfully!`)
    } else {
      toast.error(res.error || `Failed to update flag: ${id}`)
    }
    setTogglingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 text-xs">
      <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-xl text-rose-800 flex items-start gap-2.5">
        <ShieldAlert className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Production Control Notice</span>
          <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
            Toggling feature flags below changes system behavior dynamically across the platform. Verify matching RLS rules and external API endpoints (like Video/Voice SDKs) are active before enabling.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {flags.length === 0 ? (
          <div className="p-6 text-center text-zinc-400 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200">
            No system feature flags cataloged in database.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flags.map((flag) => {
              const active = flag.is_enabled
              const isPending = togglingId === flag.id

              return (
                <div
                  key={flag.id}
                  className={`p-4 border rounded-xl flex flex-col justify-between transition bg-white dark:bg-gray-900/50 ${
                    active
                      ? 'border-pink-500/30 shadow-sm shadow-pink-500/5'
                      : 'border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-gray-850 dark:text-gray-200">{flag.name}</h4>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-pink-500 mt-0.5 block">
                          code: {flag.id}
                        </span>
                      </div>
                      
                      {/* Toggle switch UI */}
                      <button
                        type="button"
                        onClick={() => handleToggle(flag.id, flag.is_enabled)}
                        disabled={isPending}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors relative flex items-center cursor-pointer ${
                          active ? 'bg-pink-500' : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform ${
                            active ? 'translate-x-4.5' : 'translate-x-0'
                          } flex items-center justify-center`}
                        >
                          {isPending ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin text-pink-500" />
                          ) : active ? (
                            <Check className="w-2.5 h-2.5 text-pink-500" strokeWidth={3} />
                          ) : (
                            <X className="w-2.5 h-2.5 text-gray-400" strokeWidth={3} />
                          )}
                        </div>
                      </button>
                    </div>
                    <p className="text-gray-500 font-medium text-[10px] leading-snug">{flag.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
