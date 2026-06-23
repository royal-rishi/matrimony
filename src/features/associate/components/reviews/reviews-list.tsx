'use client'
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from 'react'
import { getMyReviews } from '@/features/associate/actions/review-actions'
import { Star, Flag, MessageSquare, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { flagReview } from '@/features/associate/actions/review-actions'

export function ReviewsList() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [flaggingId, setFlaggingId] = useState<string | null>(null)
  const [flagReason, setFlagReason] = useState('')

  const loadReviews = React.useCallback(async () => {
    setLoading(true)
    const res = await getMyReviews()
    if (res.success && res.data) {
      setRedefinedReviews(res.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  const setRedefinedReviews = (data: any[]) => {
    setReviews(data)
  }

  const handleFlagReview = async (reviewId: string) => {
    if (!flagReason.trim()) {
      toast.error('Please enter a reason for flagging')
      return
    }

    const res = await flagReview(reviewId, flagReason)
    if (res.success) {
      toast.success('Review flagged for admin review and dispute created!')
      setFlagReason('')
      setFlaggingId(null)
      loadReviews()
    } else {
      toast.error(res.error || 'Failed to flag review')
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={14}
            className={s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-800'}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
          Client Feedback & Reviews
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review ratings submitted by clients upon case completion.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950">
          <MessageSquare className="text-gray-300 w-12 h-12 mb-3" />
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">No Reviews Yet</p>
          <p className="text-xs text-gray-400 mt-1">Reviews appear once cases are completed and rated by clients.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => {
            const clientName = rev.client
              ? `${rev.client.first_name} ${rev.client.last_name}`
              : 'Anonymous Client'
            const isFlagged = flaggingId === rev.id

            return (
              <div
                key={rev.id}
                className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-2xl p-5 shadow-sm space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {rev.client?.avatar_url ? (
                      <img
                        src={rev.client.avatar_url}
                        alt={clientName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-inner">
                        {rev.client?.first_name[0]}{rev.client?.last_name[0]}
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white">
                        {clientName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(rev.rating)}
                        <span className="text-[10px] text-gray-400 dark:text-gray-500" suppressHydrationWarning>
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setFlaggingId(isFlagged ? null : rev.id)}
                    className="text-gray-400 hover:text-red-500 transition cursor-pointer"
                    title="Flag / Dispute Review"
                  >
                    <Flag size={16} />
                  </button>
                </div>

                {rev.review && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed pl-13">
                    {rev.review}
                  </p>
                )}

                {isFlagged && (
                  <div className="pl-13 pt-3 border-t border-gray-100 dark:border-gray-900 space-y-3">
                    <div className="p-3 bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-2">
                      <AlertTriangle className="text-red-500 w-4 h-4 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-red-700 dark:text-red-400">
                        <strong>Dispute Review:</strong> Flagging this review will escalate it to the Territorial Admin/SuperAdmin for moderation or removal.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Reason for disputing (e.g. false claims, inappropriate language)..."
                        value={flagReason}
                        onChange={(e) => setFlagReason(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                      />
                      <button
                        onClick={() => handleFlagReview(rev.id)}
                        className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold shadow cursor-pointer"
                      >
                        Submit Dispute
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
