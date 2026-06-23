'use client'
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from 'react'
import { getMarriageSuccesses } from '@/features/associate/actions/marriage-actions'
import { RecordMarriageForm } from './record-marriage-form'
import { Heart, Plus, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react'

export function MarriageSuccessBoard() {
  const [successes, setSuccesses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    loadSuccesses()
  }, [])

  const loadSuccesses = async () => {
    setLoading(true)
    const res = await getMarriageSuccesses()
    if (res.success && res.data) {
      setSuccesses(res.data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
            Marriage Success Gallery
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Browse and log verified successful matrimonial alignments.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <Plus size={16} /> Record Success
        </button>
      </div>

      {/* Grid of Success Stories */}
      {successes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950">
          <Heart className="text-gray-300 w-12 h-12 mb-3" />
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">No Success Stories Recorded</p>
          <p className="text-xs text-gray-400 mt-1">Be the first to record a success story and claim your ₹2,000 bonus!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {successes.map((story) => {
            const groomName = story.groom ? `${story.groom.first_name} ${story.groom.last_name}` : 'Groom'
            const brideName = story.bride ? `${story.bride.first_name} ${story.bride.last_name}` : 'Bride'
            const primaryPhoto = story.photos?.[0] || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=300&auto=format&fit=crop'

            return (
              <div
                key={story.id}
                className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
              >
                {/* Photo cover with overlay badges */}
                <div className="relative h-48 bg-gray-100 dark:bg-gray-900">
                  <img
                    src={primaryPhoto}
                    alt={`${groomName} and ${brideName}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Verification badge */}
                  <span className={`absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md ${
                    story.verified_by_admin
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}>
                    {story.verified_by_admin ? <ShieldCheck size={10} /> : <AlertCircle size={10} />}
                    {story.verified_by_admin ? 'Verified' : 'Awaiting Review'}
                  </span>

                  {/* Groom & Bride Overlay names */}
                  <div className="absolute bottom-3 left-4 text-white">
                    <h4 className="font-extrabold text-sm flex items-center gap-1.5">
                      {groomName} <Heart size={10} className="fill-pink-500 text-pink-500 shrink-0" /> {brideName}
                    </h4>
                    <p className="text-[10px] text-white/80 font-medium mt-0.5" suppressHydrationWarning>
                      Married on {new Date(story.marriage_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Narrative body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-4">
                    {story.success_story}
                  </p>
                  
                  {story.verified_by_admin && (
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-900 flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                      <Sparkles size={12} />
                      <span>₹2,000 Success Payout Released</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAddForm && (
        <RecordMarriageForm
          onClose={() => setShowAddForm(false)}
          onSuccess={loadSuccesses}
        />
      )}
    </div>
  )
}
