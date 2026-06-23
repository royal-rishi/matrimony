'use client'
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect } from 'react'
import { getAdminMarriages, verifyMarriageSuccess } from '@/features/admin/actions/marriage-actions'
import { toast } from 'sonner'
import { Award, Heart } from 'lucide-react'

export function SuccessStoryCurator() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modals / Details
  const [selectedStory, setSelectedStory] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)

  const loadMarriages = async () => {
    setLoading(true)
    const res = await getAdminMarriages({})
    if (res.success && res.data) {
      setItems(res.data)
    } else {
      toast.error(res.error || 'Failed to fetch marriages queue')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadMarriages()
  }, [])

  const handleVerify = async (verified: boolean) => {
    if (!selectedStory) return

    const res = await verifyMarriageSuccess({
      successId: selectedStory.id,
      verified,
      isFeatured,
      notes: notes || undefined,
    })

    if (res.success) {
      toast.success(verified ? 'Marriage Success verified and bonus payout calculated!' : 'Marriage Success rejected')
      setNotes('')
      setSelectedStory(null)
      loadMarriages()
    } else {
      toast.error(res.error || 'Failed to submit verification')
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
          Marriage Success Story Registrar
        </h1>
        <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-wider">
          Verify couples marriage completion claims and authorize local associate success bonuses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Pending list */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 p-4 shadow-sm h-fit space-y-3">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-150 pb-2 mb-3">
            Marriage Claims Queue ({items.length})
          </h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-center text-xs text-gray-400 py-6">Loading marriages registry...</p>
            ) : items.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-6">No pending marriage verifications.</p>
            ) : (
              items.map((item) => {
                const groomName = item.groom ? `${item.groom.first_name} ${item.groom.last_name}` : 'Groom'
                const brideName = item.bride ? `${item.bride.first_name} ${item.bride.last_name}` : 'Bride'
                const active = selectedStory?.id === item.id
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedStory(item)
                      setNotes(item.success_story || '')
                      setIsFeatured(item.is_featured || false)
                    }}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition flex justify-between items-center ${
                      active
                        ? 'border-pink-500 bg-pink-500/5 text-pink-500'
                        : 'border-gray-100 dark:border-gray-900 hover:bg-gray-50/50'
                    }`}
                  >
                    <div>
                      <span className="block font-bold text-gray-700 dark:text-gray-200">
                        {groomName} & {brideName}
                      </span>
                      <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                        Attribution: Case #{item.case_id.substring(0, 8)}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      {item.verified_at ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Side: Detailed Story Verification Canvas */}
        <div className="lg:col-span-2 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm space-y-6">
          {selectedStory ? (
            <>
              {/* Story Header */}
              <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-900 pb-5">
                <div>
                  <h3 className="text-base font-black text-gray-800 dark:text-white flex items-center gap-1.5">
                    <Heart size={16} className="text-rose-500 fill-rose-500" />
                    Success Verification: {selectedStory.groom?.first_name} & {selectedStory.bride?.first_name}
                  </h3>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-1" suppressHydrationWarning>
                    Marriage Date: {new Date(selectedStory.marriage_date).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Photos Gallery preview */}
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Couple Photos Gallery</h4>
                {selectedStory.photos && selectedStory.photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {selectedStory.photos.map((pUrl: string, idx: number) => (
                      <img
                        key={idx}
                        src={pUrl}
                        alt="Couple Photo Attachment"
                        className="w-full h-28 object-cover rounded-xl border border-gray-100 shadow-inner"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 italic">No gallery photos uploaded</p>
                )}
              </div>

              {/* Story Editor text */}
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Success Story Testimonial</label>
                  <textarea
                    placeholder="Couple success story testimonial..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-pink-500/30 min-h-[100px]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded text-pink-500"
                  />
                  <label htmlFor="isFeatured" className="text-[10px] font-bold text-gray-400 uppercase cursor-pointer">
                    Feature on Homepage Success Story Carousel
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100 dark:border-gray-900">
                {!selectedStory.verified_at ? (
                  <>
                    <button
                      onClick={() => handleVerify(false)}
                      className="px-4 py-2 border border-rose-200 text-rose-500 hover:bg-rose-50/50 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Reject attribution claim
                    </button>
                    <button
                      onClick={() => handleVerify(true)}
                      className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      Verify Couple & Attribute Bonus
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-emerald-500 font-bold">Successfully Verified & Closed.</p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <Award size={40} className="text-gray-300 mx-auto mb-4" />
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider animate-pulse">
                Select a couple claim to verify.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
