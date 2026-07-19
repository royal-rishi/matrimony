'use server'

// ============================================================
// SERVER ACTIONS — Observability & Reporting Platform
// Enforces admin permissions before dispatching queries to services.
// ============================================================

import { getAdminSession } from '@/features/admin'
import {
  AnalyticsService,
  ForecastService,
  HealthCheckService,
  ReportService,
  AuditService,
  AlertService,
} from '../services'
import type {
  AnalyticsParams,
  ForecastMetric,
  ReportType,
  ExportFormat,
  SystemHealthReport,
  ReportSummary,
  AuditEvent,
  ForecastResult,
} from '../types/observability.types'

async function checkAuth() {
  const session = await getAdminSession()
  if (!session) {
    throw new Error('Unauthorized. Active admin session required.')
  }
}

export async function getAnalytics(params: AnalyticsParams): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    await checkAuth()
    const service = new AnalyticsService()
    
    // Default route type handler mapping
    const summary = await service.getExecutiveSummary()
    return { success: true, data: summary }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Analytics dispatch failed.' }
  }
}

export async function generateForecast(
  metric: ForecastMetric,
  days: number = 7
): Promise<{ success: boolean; data?: ForecastResult; error?: string }> {
  try {
    await checkAuth()
    const service = new ForecastService()

    let forecast: ForecastResult
    if (metric === 'volume') {
      forecast = await service.forecastVolume(days)
    } else if (metric === 'cost') {
      forecast = await service.forecastCost(days)
    } else {
      forecast = await service.forecastQueueSize(days * 24)
    }

    await service.saveForecast(forecast)
    return { success: true, data: forecast }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Forecast generation failed.' }
  }
}

export async function runHealthCheck(): Promise<{ success: boolean; data?: SystemHealthReport; error?: string }> {
  try {
    await checkAuth()
    const service = new HealthCheckService()
    const report = await service.runFullHealthCheck()
    return { success: true, data: report }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'System health scan failed.' }
  }
}

export async function generateReport(
  type: ReportType,
  params?: { date?: string; period?: string }
): Promise<{ success: boolean; data?: ReportSummary; error?: string }> {
  try {
    await checkAuth()
    const service = new ReportService()
    const period = params?.period ?? '7d'

    let summary: ReportSummary
    if (type === 'daily') {
      summary = await service.generateDailyReport(params?.date)
    } else if (type === 'weekly') {
      summary = await service.generateWeeklyReport(params?.date)
    } else if (type === 'monthly') {
      summary = await service.generateMonthlyReport(params?.date)
    } else if (type === 'provider') {
      summary = await service.generateProviderReport(period)
    } else {
      summary = await service.generateCostReport(period)
    }

    return { success: true, data: summary }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Report generation failed.' }
  }
}

export async function exportAnalytics(
  format: ExportFormat,
  params: AnalyticsParams
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    await checkAuth()
    const service = new ReportService()
    const analytics = new AnalyticsService()

    const channelStats = await analytics.getChannelAnalytics(params)
    
    // Map list to format
    const dataList = channelStats.map((c) => ({
      channel: c.channel,
      total_sent: c.sent,
      delivered: c.delivered,
      failed: c.failed,
      delivery_rate: `${c.deliveryRate}%`,
      avg_latency_ms: c.avgLatencyMs,
      total_cost: c.costUnits,
    }))

    const exported = format === 'csv'
      ? await service.exportToCSV(dataList, 'channel_analytics')
      : await service.exportToJSON(dataList)

    return { success: true, data: exported }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Export failed.' }
  }
}

export async function getAuditTrail(params?: { entityType?: string; limit?: number }): Promise<{ success: boolean; data?: AuditEvent[]; error?: string }> {
  try {
    await checkAuth()
    const service = new AuditService()
    const trail = await service.getAuditTrail(params)
    return { success: true, data: trail }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Audit lookup failed.' }
  }
}

export async function evaluateAndUpdateAlerts(): Promise<{ success: boolean; triggered?: number; error?: string }> {
  try {
    await checkAuth()
    const service = new AlertService()
    const res = await service.evaluateAlerts()
    return { success: true, triggered: res.triggered.length }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Alert evaluation sequence failed.' }
  }
}
