'use client'
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react'
import { recordMarriageSuccess } from '@/features/associate/actions/marriage-actions'
import { toast } from 'sonner'
import { Heart, Plus } from 'lucide-react'

export function RecordMarriageForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [groomId, setGroomId] = useState('')
  const [brideId, setBrideId] = useState('')
  const [caseId, setCaseId] = useState('')
  const [marriageDate, setMarriageDate] = useState('')
  const [engagementDate, setEngagementDate] = useState('')
  const [successStory, setSuccessStory] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleAddPhoto = () => {
    if (!photoUrl.trim()) return
    setPhotos([...photos, photoUrl])
    setPhotoUrl('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groomId || !brideId || !marriageDate || !successStory) {
      toast.error('Please fill in all required fields')
      return
    }
    if (successStory.length < 50) {
      toast.error('Success story must be at least 50 characters')
      return
    }
    if (photos.length === 0) {
      toast.error('Please add at least one photo')
      return
    }

    setSubmitting(true)
    try {
      const res = await recordMarriageSuccess({
        groomId,
        brideId,
        caseId: caseId || undefined,
        marriageDate,
        engagementDate: engagementDate || undefined,
        successStory,
        photos,
      })

      if (res.success) {
        toast.success('Marriage success record logged successfully!')
        onSuccess()
        onClose()
      } else {
        toast.error(res.error || 'Failed to record success story')
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2">
          <Heart className="text-pink-500 fill-pink-500" />
          <h3 className="text-lg font-extrabold text-gray-800 dark:text-white">
            Log Matrimonial Success Story
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Groom Profile ID (UUID) *
              </label>
              <input
                type="text"
                value={groomId}
                onChange={(e) => setGroomId(e.target.value)}
                placeholder="Groom user profile ID..."
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Bride Profile ID (UUID) *
              </label>
              <input
                type="text"
                value={brideId}
                onChange={(e) => setBrideId(e.target.value)}
                placeholder="Bride user profile ID..."
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Marriage Date *
              </label>
              <input
                type="date"
                value={marriageDate}
                onChange={(e) => setMarriageDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Engagement Date
              </label>
              <input
                type="date"
                value={engagementDate}
                onChange={(e) => setEngagementDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Associated Matchmaking Case ID (Optional)
            </label>
            <input
              type="text"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              placeholder="Enter match case ID to link commission bonus..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Success Story Description *
            </label>
            <textarea
              value={successStory}
              onChange={(e) => setSuccessStory(e.target.value)}
              placeholder="Narrate details of their matching journey, family interactions, and engagement ceremony (min 50 chars)..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none resize-none"
              required
            />
          </div>

          {/* Photo uploads list */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Wedding / Ceremony Photos *
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Paste ceremony image URL..."
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddPhoto}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-bold hover:bg-gray-200 transition cursor-pointer"
              >
                <Plus size={16} />
              </button>
            </div>

            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2.5 pt-2">
                {photos.map((url, index) => (
                  <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                    <img src={url} alt="ceremony" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 text-[8px] cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              {submitting ? 'Recording...' : 'Record Success'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
