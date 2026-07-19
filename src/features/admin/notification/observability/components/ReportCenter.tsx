'use client'

// ============================================================
// REPORT GENERATION & EXPORTS CENTER — Phase 10
// Configures daily/weekly/monthly statistics tables, displays
// print-ready summaries, and formats CSV/JSON file exports.
// ============================================================

import React, { useState } from 'react'
import {
  FileText,
  Download,
  Calendar,
  Send,
  CheckCircle,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ReportSummary, ReportType } from '../types/observability.types'

export default function ReportCenter() {
  const [reportType, setReportType] = useState<ReportType>('daily')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]!)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<ReportSummary | null>(null)
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/notification/reports?type=${reportType}&date=${date}`)
      const json = await res.json()
      if (json.success) {
        setReport(json.data)
        toast.success(`${reportType.toUpperCase()} report generated successfully.`)
      } else {
        toast.error('Failed to generate report.')
      }
    } catch (err) {
      toast.error('Network error generating report.')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/admin/notification/cost?type=channel&period=7d`)
      const json = await res.json()
      if (json.success) {
        let content = ''
        if (exportFormat === 'csv') {
          const headers = 'channel,cost,messageCount,percentage'
          const rows = json.data.map((c: any) => `${c.channel},${c.cost},${c.messageCount},${c.percentage}%`)
          content = [headers, ...rows].join('\n')
        } else {
          content = JSON.stringify(json.data, null, 2)
        }

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `notification_metrics_export.${exportFormat}`
        a.click()
        URL.revokeObjectURL(url)
        toast.success(`Analytics exported as ${exportFormat.toUpperCase()}`)
      }
    } catch (err) {
      toast.error('Export failed.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Controls Card */}
        <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 p-5 shadow-sm space-y-4 h-fit">
          <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">Compile Diagnostics Report</h3>
          
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Report Scope</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent focus:outline-none focus:ring-1 focus:ring-rose-500/20"
              >
                <option value="daily">Daily Metrics Sheet</option>
                <option value="weekly">Weekly Aggregated Run</option>
                <option value="monthly">Monthly Executive Review</option>
                <option value="provider">Provider Outbound Summary</option>
                <option value="cost">Channel Budget Audit</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Target Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent focus:outline-none focus:ring-1 focus:ring-rose-500/20"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <FileText size={12} />
              {loading ? 'Compiling...' : 'Generate Report Preview'}
            </button>
          </div>

          <div className="pt-4 border-t border-gray-50 dark:border-gray-900 space-y-3">
            <h4 className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[10px]">Data Table Export</h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`flex-1 py-1.5 border rounded-lg font-bold text-[9px] uppercase cursor-pointer transition ${
                  exportFormat === 'csv'
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-transparent text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800'
                }`}
              >
                CSV Table
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('json')}
                className={`flex-1 py-1.5 border rounded-lg font-bold text-[9px] uppercase cursor-pointer transition ${
                  exportFormat === 'json'
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-transparent text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800'
                }`}
              >
                JSON Payload
              </button>
            </div>

            <button
              type="button"
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-1.5 py-2 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-750 dark:text-gray-300 font-bold rounded-xl transition cursor-pointer"
            >
              <Download size={12} />
              Download Dataset
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 p-5 shadow-sm min-h-[300px]">
          {report ? (
            <div className="space-y-5 animate-fade-in">
              <div className="flex justify-between items-start border-b border-gray-50 dark:border-gray-900 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Generated Review Sheets</span>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1 capitalize">{report.type} Report: {report.period}</h3>
                </div>
                <span className="text-[10px] text-gray-400 font-semibold">Compiled At: {new Date(report.generatedAt).toLocaleTimeString()}</span>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                {[
                  { label: 'Outbound Dispatched', value: report.totalNotifications.toLocaleString() },
                  { label: 'Successful Delivery', value: `${report.deliveryRate}%` },
                  { label: 'Failure Bounce Rate', value: `${report.failureRate}%` },
                  { label: 'Accumulated Spend', value: `₹${report.totalCost.toFixed(2)}` },
                  { label: 'Primary Network', value: report.topChannel.toUpperCase() },
                  { label: 'Incident Triggers', value: report.alertsTriggered },
                ].map((stat, i) => (
                  <div key={i} className="p-3 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-900 rounded-xl">
                    <span className="text-[9px] text-gray-450 font-bold uppercase block">{stat.label}</span>
                    <span className="font-black text-gray-900 dark:text-white text-sm mt-0.5 block">{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Custom data details map */}
              <div className="space-y-2 pt-2 border-t border-gray-50 dark:border-gray-900">
                <h4 className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[9px]">Additional Context Details</h4>
                <div className="space-y-1.5 font-mono text-[10px] text-gray-600 dark:text-gray-400">
                  {Object.entries(report.data).map(([key, val]) => (
                    <div key={key} className="flex justify-between p-2 bg-gray-50/30 dark:bg-gray-900/10 rounded-lg">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-bold">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20 gap-2">
              <Eye size={32} strokeWidth={1.5} className="text-gray-300 dark:text-gray-800" />
              <p className="font-semibold">No report preview compiled yet.</p>
              <p className="text-[10px] text-gray-500">Configure parameters on the left and trigger diagnostics compile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
