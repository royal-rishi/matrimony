import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AnalyticsService } from '../observability/services/analytics.service'
import { AlertService } from '../observability/services/alert.service'
import { CostAnalyticsService } from '../observability/services/cost-analytics.service'
import { ForecastService } from '../observability/services/forecast.service'
import { ReportService } from '../observability/services/report.service'
import { HealthCheckService } from '../observability/services/health-check.service'

class SupabaseMockBuilder {
  private resolvedValue: any
  constructor(resolvedValue: any = { data: null, error: null }) {
    this.resolvedValue = resolvedValue
  }
  select() { return this }
  insert() { return this }
  update() { return this }
  delete() { return this }
  eq() { return this }
  in() { return this }
  gt() { return this }
  is() { return this }
  order() { return this }
  limit() { return this }
  maybeSingle() { return this }
  not() { return this }
  gte() { return this }
  lte() { return this }
  lt() { return this }
  then(onfulfilled: any) {
    return Promise.resolve(this.resolvedValue).then(onfulfilled)
  }
}

const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => Promise.resolve(mockSupabase)),
}))

describe('Observability Services Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('AnalyticsService getExecutiveSummary should query statistics', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'notification_analytics') {
        return new SupabaseMockBuilder({ data: { total_sent: 100, delivered: 95, failed: 5, sms_sent: 50, emails_sent: 50 }, error: null })
      }
      return new SupabaseMockBuilder({ data: [], error: null })
    })

    const service = new AnalyticsService()
    const summary = await service.getExecutiveSummary()
    expect(summary.totalSent).toBe(100)
    expect(summary.deliveryRate).toBe(95)
    expect(summary.failureRate).toBe(5)
  })

  it('AlertService getAllAlertRules should load alerts config list', async () => {
    mockSupabase.from.mockImplementation(() => {
      return new SupabaseMockBuilder({
        data: [
          { id: 'a1', name: 'High Fails', metric: 'failure_rate', threshold: 10, comparison: 'gt', window_minutes: 15, is_active: true, is_triggered: false },
        ],
        error: null,
      })
    })

    const service = new AlertService()
    const rules = await service.getAllAlertRules()
    expect(rules).toHaveLength(1)
    expect(rules[0]!.metric).toBe('failure_rate')
  })

  it('CostAnalyticsService getTodayCost should sum today cost', async () => {
    mockSupabase.from.mockImplementation(() => {
      return new SupabaseMockBuilder({
        data: [
          { channel: 'sms', cost_units: 1.5 },
          { channel: 'email', cost_units: 0.25 },
        ],
        error: null,
      })
    })

    const service = new CostAnalyticsService()
    const cost = await service.getTodayCost()
    expect(cost.totalCost).toBe(1.75)
    expect(cost.smsCost).toBe(1.5)
  })

  it('ForecastService forecastVolume should output OLS predictive points', async () => {
    mockSupabase.from.mockImplementation(() => {
      return new SupabaseMockBuilder({
        data: [
          { date: '2026-07-01', total_sent: 1000 },
          { date: '2026-07-02', total_sent: 1200 },
          { date: '2026-07-03', total_sent: 1400 },
        ],
        error: null,
      })
    })

    const service = new ForecastService()
    const res = await service.forecastVolume(3)
    expect(res.forecastPoints).toHaveLength(3)
    expect(res.trend).toBe('up')
  })

  it('ReportService generateDailyReport should build Daily report preview', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'notification_analytics') {
        return new SupabaseMockBuilder({ data: { total_sent: 50, delivered: 48, failed: 2, total_cost: 4.5 }, error: null })
      }
      return new SupabaseMockBuilder({ data: [], error: null })
    })

    const service = new ReportService()
    const report = await service.generateDailyReport()
    expect(report.type).toBe('daily')
    expect(report.deliveryRate).toBe(96)
    expect(report.totalCost).toBe(4.5)
  })

  it('HealthCheckService runFullHealthCheck should status database & engines', async () => {
    mockSupabase.from.mockImplementation(() => {
      return new SupabaseMockBuilder({ data: [], error: null })
    })

    const service = new HealthCheckService()
    const health = await service.runFullHealthCheck()
    expect(health.overallStatus).toBe('healthy')
    expect(health.components).toHaveLength(3)
  })
})
