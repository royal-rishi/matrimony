'use client'

// ============================================================
// LIVE SYSTEM MONITORING POLLING HOOK
// Intermittently refreshes today's delivery KPIs & alerts count.
// ============================================================

import { useEffect, useState, useCallback } from 'react'
import type { ExecutiveSummary } from '../types/observability.types'

export function useLiveMetrics(initialSummary?: ExecutiveSummary) {
  const [summary, setSummary] = useState<ExecutiveSummary | null>(initialSummary ?? null)
  const [isLoading, setIsLoading] = useState(!initialSummary)
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toISOString())

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/notification/analytics?type=summary')
      const json = await response.json()
      if (json.success && json.data) {
        setSummary(json.data)
        setLastRefreshed(new Date().toISOString())
      }
    } catch (err) {
      console.error('Error polling KPIs overview:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()

    // Poll every 30 seconds
    const interval = setInterval(refresh, 30000)

    return () => clearInterval(interval)
  }, [refresh])

  return { summary, isLoading, lastRefreshed, refresh }
}
