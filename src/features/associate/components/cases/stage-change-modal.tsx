'use client'

import React, { useState } from 'react'
import { updateCaseStage } from '@/features/associate/actions/case-actions'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'

const STAGE_LABELS: Record<string, string> = {
  new: 'New Lead',
  requirement_collection: 'Requirement Collection',
  searching: 'Searching Matches',
  profiles_shared: 'Profiles Shared',
  interested: 'Client Interested',
  family_discussion: 'Family Discussion',
  meeting_scheduled: 'Meeting Scheduled',
  meeting_completed: 'Meeting Completed',
  engagement: 'Engagement',
  marriage_completed: 'Marriage Completed',
  closed: 'Closed / Inactive',
}

export function StageChangeModal({
  caseId,
  currentStatus,
  onClose,
  onSuccess,
}: {
  caseId: string
  currentStatus: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [targetStage, setTargetStage] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetStage) {
      toast.error('Please select a target stage')
      return
    }
    if (!notes.trim()) {
      toast.error('Please enter transition audit notes')
      return
    }

    setSubmitting(true)
    try {
      const res = await updateCaseStage({
        caseId,
        status: targetStage,
        notes,
      })

      if (res.success) {
        toast.success(`Case stage updated to ${STAGE_LABELS[targetStage]}!`)
        onSuccess()
        onClose()
      } else {
        toast.error(res.error || 'Failed to update stage')
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div>
          <h3 className="text-lg font-extrabold text-gray-800 dark:text-white">
            Transition Case Stage
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Current Stage: <span className="font-bold text-gray-600 dark:text-gray-300">{STAGE_LABELS[currentStatus] || currentStatus}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Target Stage
            </label>
            <select
              value={targetStage}
              onChange={(e) => setTargetStage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              required
            >
              <option value="">Select Stage...</option>
              {Object.entries(STAGE_LABELS)
                .filter(([key]) => key !== currentStatus)
                .map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Transition Notes / Audit Reason
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide reason for moving to this stage (required for CRM history)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
              required
            />
          </div>

          {targetStage === 'marriage_completed' && (
            <div className="p-3 rounded-lg border border-pink-100 bg-pink-50/50 dark:border-pink-900/30 dark:bg-pink-950/10 flex items-start gap-2.5">
              <CheckCircle2 className="text-pink-500 w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-[10px] text-pink-700 dark:text-pink-400">
                <strong>Marriage Success Bonus Trigger:</strong> Moving to this stage will allow you to record success details and unlock your ₹2,000 success bonus upon admin verification.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Confirm Transition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
