'use client'
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState, useCallback } from 'react'
import { getClientProfile, updateClientPreferences, assistDocumentUpload } from '@/features/associate/actions/client-actions'
import { toast } from 'sonner'
import { Upload, Heart } from 'lucide-react'

export function ClientProfileView({ clientId }: { clientId: string }) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Preference states
  const [prefAgeMin, setPrefAgeMin] = useState(21)
  const [prefAgeMax, setPrefAgeMax] = useState(35)
  const [prefReligion, setPrefReligion] = useState('')
  const [prefCaste, setPrefCaste] = useState('')
  const [prefCity, setPrefCity] = useState('')
  const [prefEducation, setPrefEducation] = useState('')
  
  // Document assistance states
  const [fileUrl, setFileUrl] = useState('')
  const [docType, setDocType] = useState('kyc_id_proof')

  const loadProfile = useCallback(async () => {
    setLoading(true)
    const res = await getClientProfile(clientId)
    if (res.success && res.data) {
      setProfile(res.data)
      // Initialize preference form states
      const pref = res.data.partner_preferences || {}
      setPrefAgeMin(pref.ageMin || 21)
      setPrefAgeMax(pref.ageMax || 35)
      setPrefReligion(pref.religion || '')
      setPrefCaste(pref.caste || '')
      setPrefCity(pref.city || '')
      setPrefEducation(pref.education || '')
    } else {
      toast.error(res.error || 'Failed to load client profile')
    }
    setLoading(false)
  }, [clientId])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    const preferences = {
      ageMin: Number(prefAgeMin),
      ageMax: Number(prefAgeMax),
      religion: prefReligion,
      caste: prefCaste,
      city: prefCity,
      education: prefEducation,
    }

    const res = await updateClientPreferences(clientId, preferences)
    if (res.success) {
      toast.success('Matching preferences updated successfully!')
      loadProfile()
    } else {
      toast.error(res.error || 'Failed to update preferences')
    }
  }

  const handleAssistUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fileUrl.trim()) return

    const res = await assistDocumentUpload(clientId, fileUrl, docType)
    if (res.success) {
      toast.success('Document upload assistance recorded in timeline!')
      setFileUrl('')
    } else {
      toast.error(res.error || 'Failed to submit document upload log')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      </div>
    )
  }

  if (!profile) return <div className="text-center py-12 text-sm text-gray-500">Client profile not found.</div>

  const clientName = `${profile.first_name} ${profile.last_name}`

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
          Client Manager: {clientName}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review details, update matchmaking criteria, and log document assistance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card Summary */}
        <div className="space-y-6">
          <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={clientName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-pink-500/20 shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center font-black text-white text-3xl shadow-inner">
                  {profile.first_name[0]}{profile.last_name[0]}
                </div>
              )}
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mt-4">{clientName}</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold mt-1">
                {profile.is_premium ? 'Premium Elite Member' : 'Free Trial Client'}
              </p>
            </div>

            <div className="mt-6 space-y-3.5 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-6">
              <div className="flex justify-between">
                <span className="font-bold text-gray-400 uppercase tracking-wider text-[9px]">City/State</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{profile.city}, {profile.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-gray-400 uppercase tracking-wider text-[9px]">Education</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[150px]" title={profile.education}>{profile.education || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-gray-400 uppercase tracking-wider text-[9px]">Occupation</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[150px]" title={profile.occupation}>{profile.occupation || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-gray-400 uppercase tracking-wider text-[9px]">Annual Income</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {profile.annual_income ? `₹${Number(profile.annual_income).toLocaleString('en-IN')}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Document Assistance Box */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm">
            <h3 className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-3 mb-4 flex items-center gap-2">
              <Upload size={16} className="text-pink-500" /> Assist Upload
            </h3>

            <form onSubmit={handleAssistUpload} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                >
                  <option value="kyc_id_proof">KYC National ID Proof</option>
                  <option value="kyc_address_proof">KYC Address Proof</option>
                  <option value="bio_data">Marriage Bio-Data PDF</option>
                  <option value="profile_photo">Secondary Profile Photo</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Document File URL
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://supabase-storage-url.com/..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                Log Assisted Upload
              </button>
            </form>
          </div>
        </div>

        {/* Update Partner Preferences Form */}
        <div className="lg:col-span-2 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm h-fit">
          <h3 className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-3 mb-6 flex items-center gap-2">
            <Heart size={16} className="text-rose-500" /> Matchmaking Partner Preferences
          </h3>

          <form onSubmit={handleUpdatePreferences} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Preferred Minimum Age
                </label>
                <input
                  type="number"
                  value={prefAgeMin}
                  onChange={(e) => setPrefAgeMin(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  min={18}
                  max={100}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Preferred Maximum Age
                </label>
                <input
                  type="number"
                  value={prefAgeMax}
                  onChange={(e) => setPrefAgeMax(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  min={18}
                  max={100}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Preferred Religion
                </label>
                <input
                  type="text"
                  value={prefReligion}
                  onChange={(e) => setPrefReligion(e.target.value)}
                  placeholder="Hindu, Muslim, Sikh, Christian..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Preferred Caste / Sub-Caste
                </label>
                <input
                  type="text"
                  value={prefCaste}
                  onChange={(e) => setPrefCaste(e.target.value)}
                  placeholder="Agarwal, Brahmin, Rajput..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Preferred City / Region
                </label>
                <input
                  type="text"
                  value={prefCity}
                  onChange={(e) => setPrefCity(e.target.value)}
                  placeholder="Mumbai, New Delhi, Bengaluru..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Preferred Education
                </label>
                <input
                  type="text"
                  value={prefEducation}
                  onChange={(e) => setPrefEducation(e.target.value)}
                  placeholder="MBA, B.Tech, MCA, MD..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer"
            >
              Save Preferences
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
