'use client'

import React, { useState } from 'react'
import { respondToDispute } from '@/features/associate/actions/dispute-actions'
import { toast } from 'sonner'

export function DisputeRespondModal({
  disputeId,
  onClose,
  onSuccess,
}: {
  disputeId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notes.trim()) return

    setSubmitting(true)
    try {
      const res = await respondToDispute({
        disputeId,
        resolutionNotes: notes,
      })

      if (res.success) {
        toast.success('Response submitted successfully!')
        onSuccess()
        onClose()
      } else {
        toast.error(res.error || 'Failed to submit response')
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div>
          <h3 className="text-lg font-extrabold text-gray-800 dark:text-white">
            Respond to Dispute Case
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Provide a formal statement or resolution notes regarding the client dispute.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Resolution Statement
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain details of services rendered, meeting details, or feedback resolution (min 10 chars)..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none resize-none"
              required
            />
          </div>

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
              {submitting ? 'Submitting...' : 'Submit Statement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
