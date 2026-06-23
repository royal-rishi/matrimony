'use client'
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useCallback } from 'react'
import {
  getCaseDetail,
  getCaseTimeline,
  addNote,
  addReminder,
  scheduleMeeting,
  shareProfile,
} from '@/features/associate/actions/case-actions'
import { StageChangeModal } from './stage-change-modal'
import { toast } from 'sonner'
import {
  Calendar,
  Clock,
  FileText,
  Sparkles,
  Award,
  ChevronRight,
  ClipboardList,
} from 'lucide-react'

export function CaseDetail({ caseId }: { caseId: string }) {
  const [c, setCase] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'timeline' | 'action_note' | 'action_reminder' | 'action_meeting' | 'action_share'>('timeline')
  const [loading, setLoading] = useState(true)
  const [showStageModal, setShowStageModal] = useState(false)

  // Form states
  const [noteText, setNoteText] = useState('')
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderBody, setReminderBody] = useState('')
  const [reminderDue, setReminderDue] = useState('')

  const [meetingTitle, setMeetingTitle] = useState('')
  const [meetingType, setMeetingType] = useState('virtual')
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingDuration, setMeetingDuration] = useState(30)
  const [meetingLink, setMeetingLink] = useState('')
  const [meetingLoc, setMeetingLoc] = useState('')
  const [meetingNotes, setMeetingNotes] = useState('')

  const [shareProfileId, setShareProfileId] = useState('')
  const [shareNotes, setShareNotes] = useState('')

  const loadCaseData = useCallback(async () => {
    setLoading(true)
    const detailRes = await getCaseDetail(caseId)
    const timelineRes = await getCaseTimeline(caseId)

    if (detailRes.success && detailRes.data) {
      setCase(detailRes.data)
      setTimeline(timelineRes.data || [])
    } else {
      toast.error(detailRes.error || 'Failed to load case details')
    }
    setLoading(false)
  }, [caseId])

  useEffect(() => {
    loadCaseData()
  }, [loadCaseData])

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteText.trim()) return

    const res = await addNote({ caseId, note: noteText })
    if (res.success) {
      toast.success('Note added to CRM!')
      setNoteText('')
      setActiveTab('timeline')
      loadCaseData()
    } else {
      toast.error(res.error || 'Failed to add note')
    }
  }

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reminderTitle.trim() || !reminderDue) return

    const res = await addReminder({
      caseId,
      title: reminderTitle,
      body: reminderBody || undefined,
      dueAt: new Date(reminderDue).toISOString(),
    })

    if (res.success) {
      toast.success('Reminder scheduled!')
      setReminderTitle('')
      setReminderBody('')
      setReminderDue('')
      setActiveTab('timeline')
      loadCaseData()
    } else {
      toast.error(res.error || 'Failed to add reminder')
    }
  }

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!meetingTitle.trim() || !meetingDate) return

    const res = await scheduleMeeting({
      caseId,
      title: meetingTitle,
      meetingType,
      scheduledAt: new Date(meetingDate).toISOString(),
      durationMinutes: Number(meetingDuration),
      meetingLink: meetingLink || undefined,
      location: meetingLoc || undefined,
      notes: meetingNotes || undefined,
      attendees: [],
    })

    if (res.success) {
      toast.success('Meeting scheduled!')
      setMeetingTitle('')
      setMeetingDate('')
      setMeetingLink('')
      setMeetingLoc('')
      setMeetingNotes('')
      setActiveTab('timeline')
      loadCaseData()
    } else {
      toast.error(res.error || 'Failed to schedule meeting')
    }
  }

  const handleShareProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shareProfileId.trim()) return

    const res = await shareProfile({
      caseId,
      sharedProfileId: shareProfileId,
      notes: shareNotes || undefined,
    })

    if (res.success) {
      toast.success('Profile shared with client!')
      setShareProfileId('')
      setShareNotes('')
      setActiveTab('timeline')
      loadCaseData()
    } else {
      toast.error(res.error || 'Failed to share profile')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!c) return <div className="text-center py-12 text-sm text-gray-500">Case not found.</div>

  const clientName = c.client ? `${c.client.first_name} ${c.client.last_name}` : 'Unnamed Client'

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            <span>Cases</span>
            <ChevronRight size={12} />
            <span>{c.case_number}</span>
          </div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white mt-1">
            CRM Workspace: {clientName}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-rose-50 text-rose-500 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/50 rounded-full text-xs font-black uppercase tracking-wider">
            {c.status.replace('_', ' ')}
          </span>
          <button
            onClick={() => setShowStageModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer"
          >
            Update Stage
          </button>
        </div>
      </div>

      {/* Main Workspace grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Client Details card */}
        <div className="space-y-6">
          <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm">
            <h3 className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
              Client Details
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {c.client?.avatar_url ? (
                  <img
                    src={c.client.avatar_url}
                    alt={clientName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-pink-500/20"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-inner">
                    {c.client?.first_name[0]}{c.client?.last_name[0]}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-white">{clientName}</h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Gender: {c.client?.gender}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-gray-500 dark:text-gray-400">
                <div>
                  <p className="font-bold uppercase tracking-wider text-[9px] text-gray-400">Religion / Caste</p>
                  <p className="mt-0.5 font-semibold text-gray-700 dark:text-gray-300">
                    {c.client?.religion || 'N/A'} {c.client?.caste ? `/ ${c.client.caste}` : ''}
                  </p>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wider text-[9px] text-gray-400">Location</p>
                  <p className="mt-0.5 font-semibold text-gray-700 dark:text-gray-300">
                    {c.client?.city}, {c.client?.state}
                  </p>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wider text-[9px] text-gray-400">Education</p>
                  <p className="mt-0.5 font-semibold text-gray-700 dark:text-gray-300 truncate">
                    {c.client?.education || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wider text-[9px] text-gray-400">Occupation</p>
                  <p className="mt-0.5 font-semibold text-gray-700 dark:text-gray-300 truncate">
                    {c.client?.occupation || 'N/A'}
                  </p>
                </div>
              </div>

              {c.requirement_notes && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="font-bold uppercase tracking-wider text-[9px] text-gray-400">Matching Requirements</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed whitespace-pre-wrap">
                    {c.requirement_notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: CRM Timeline & Actions Tabs (Right 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Tabs Header */}
          <div className="flex border-b border-gray-200 dark:border-gray-800 space-x-6 text-sm font-semibold">
            {[
              { id: 'timeline', label: 'Timeline History', icon: ClipboardList },
              { id: 'action_note', label: 'Add Note', icon: FileText },
              { id: 'action_reminder', label: 'Set Reminder', icon: Clock },
              { id: 'action_meeting', label: 'Schedule Meeting', icon: Calendar },
              { id: 'action_share', label: 'Share Profile', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 pb-4 border-b-2 transition cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-rose-500 text-rose-500 font-bold'
                      : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Action Tabs Content */}
          <div className="mt-4">
            {/* Timeline View */}
            {activeTab === 'timeline' && (
              <div className="relative border-l border-gray-200 dark:border-gray-800 ml-4 pl-6 space-y-6 max-h-[600px] overflow-y-auto pr-2">
                {timeline.length === 0 ? (
                  <p className="text-xs text-gray-500 py-6 text-center">No case activity recorded yet.</p>
                ) : (
                  timeline.map((item) => {
                    return (
                      <div key={item.id} className="relative">
                        <span className="absolute -left-10 top-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-white dark:border-gray-950 bg-slate-50 dark:bg-gray-900 text-gray-500 shadow-sm">
                          {item.type === 'note' && <FileText size={14} className="text-indigo-500" />}
                          {item.type === 'activity' && <Award size={14} className="text-amber-500" />}
                          {item.type === 'meeting' && <Calendar size={14} className="text-purple-500" />}
                          {item.type === 'profile_share' && <Sparkles size={14} className="text-pink-500" />}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                            {item.title}
                          </p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-0.5 whitespace-pre-wrap">
                            {item.description}
                          </p>
                          <span className="text-[10px] text-gray-400 mt-1 block">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* Add Note Form */}
            {activeTab === 'action_note' && (
              <form onSubmit={handleAddNote} className="space-y-4 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl bg-white dark:bg-gray-950">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    CRM Private Note
                  </label>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Enter private CRM notes for match making tracking..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer"
                >
                  Save Note
                </button>
              </form>
            )}

            {/* Add Reminder Form */}
            {activeTab === 'action_reminder' && (
              <form onSubmit={handleAddReminder} className="space-y-4 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl bg-white dark:bg-gray-950">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Reminder Title
                    </label>
                    <input
                      type="text"
                      value={reminderTitle}
                      onChange={(e) => setReminderTitle(e.target.value)}
                      placeholder="Call client family, gather documents..."
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Due Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={reminderDue}
                      onChange={(e) => setReminderDue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Description / Details
                  </label>
                  <textarea
                    value={reminderBody}
                    onChange={(e) => setReminderBody(e.target.value)}
                    placeholder="Enter additional details..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer"
                >
                  Schedule Reminder
                </button>
              </form>
            )}

            {/* Schedule Meeting Form */}
            {activeTab === 'action_meeting' && (
              <form onSubmit={handleScheduleMeeting} className="space-y-4 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl bg-white dark:bg-gray-950">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Meeting Title
                    </label>
                    <input
                      type="text"
                      value={meetingTitle}
                      onChange={(e) => setMeetingTitle(e.target.value)}
                      placeholder="First introduction call, biodata review..."
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Meeting Type
                    </label>
                    <select
                      value={meetingType}
                      onChange={(e) => setMeetingType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                    >
                      <option value="virtual">Virtual Video Call</option>
                      <option value="in_person">In-Person Meeting</option>
                      <option value="phone">Phone Call</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Scheduled Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      value={meetingDuration}
                      onChange={(e) => setMeetingDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                      min={5}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Meeting Link (Virtual)
                    </label>
                    <input
                      type="url"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="https://zoom.us/j/..."
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      Location (In-Person)
                    </label>
                    <input
                      type="text"
                      value={meetingLoc}
                      onChange={(e) => setMeetingLoc(e.target.value)}
                      placeholder="Office address, hotel lobby..."
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer"
                >
                  Schedule Meeting
                </button>
              </form>
            )}

            {/* Share Profile Form */}
            {activeTab === 'action_share' && (
              <form onSubmit={handleShareProfile} className="space-y-4 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl bg-white dark:bg-gray-950">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Profile ID to Share
                  </label>
                  <input
                    type="text"
                    value={shareProfileId}
                    onChange={(e) => setShareProfileId(e.target.value)}
                    placeholder="Enter Profile ID (UUID format)..."
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Reason for Match Suggestion
                  </label>
                  <textarea
                    value={shareNotes}
                    onChange={(e) => setShareNotes(e.target.value)}
                    placeholder="Explain why this profile is a good match suggestion (e.g. matching age, location, values)..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-xs bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer"
                >
                  Share Profile
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {showStageModal && (
        <StageChangeModal
          caseId={caseId}
          currentStatus={c.status}
          onClose={() => setShowStageModal(false)}
          onSuccess={loadCaseData}
        />
      )}
    </div>
  )
}
