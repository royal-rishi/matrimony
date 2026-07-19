'use client'

// ============================================================
// CAMPAIGN BROADCASTER WIZARD COMPONENT
// ============================================================

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendCampaign, scheduleCampaign } from '../actions/admin-notifications.actions'
import { toast } from 'sonner'

export const CampaignWizard: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Creation form values
  const [form, setForm] = useState({
    name: '',
    description: '',
    channel: 'email',
    templateId: '',
    gender: 'all',
    verified: 'all',
    scheduledFor: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    
    const { data: campaignList } = await supabase
      .from('broadcast_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: templateList } = await supabase
      .from('notification_templates')
      .select('id, name, event, channel')

    if (campaignList) setCampaigns(campaignList)
    if (templateList) setTemplates(templateList)
    setLoading(false)
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.templateId) {
      toast.error('Campaign Name and Template selection are mandatory.')
      return
    }

    const matchedTemplate = templates.find(t => t.id === form.templateId)

    try {
      const supabase = createClient()
      
      // Calculate estimated reach based on target filters
      let reachQuery = supabase.from('profiles').select('id', { count: 'exact', head: true })
      if (form.gender !== 'all') {
        reachQuery = reachQuery.eq('gender', form.gender)
      }
      if (form.verified !== 'all') {
        reachQuery = reachQuery.eq('profile_verified', form.verified === 'true')
      }

      const { count: reachCount } = await reachQuery
      const reach = reachCount || 0

      const campaignSlug = `campaign-${Date.now()}`

      const { data: newCampaign, error } = await supabase
        .from('broadcast_campaigns')
        .insert({
          name: form.name,
          description: form.description || null,
          slug: campaignSlug,
          type: 'marketing',
          channel: matchedTemplate?.channel || 'email',
          template_id: form.templateId,
          status: 'draft',
          audience_type: 'segment',
          audience_filter: {
            gender: form.gender !== 'all' ? form.gender : undefined,
            verified: form.verified !== 'all' ? form.verified === 'true' : undefined,
            variables: { promo_code: 'RISHTA20' },
          },
          estimated_reach: reach,
        } as any)
        .select('*')
        .maybeSingle()

      if (error) throw error

      toast.success('Campaign Draft created successfully.')
      setForm({ name: '', description: '', channel: 'email', templateId: '', gender: 'all', verified: 'all', scheduledFor: '' })
      loadData()
    } catch (err) {
      console.error(err)
      toast.error('Failed to create campaign draft.')
    }
  }

  const handleBroadcast = async (id: string) => {
    toast.info('Starting segmented campaign broadcast. Please do not close your window...')
    const res = await sendCampaign(id)
    if (res.success) {
      toast.success(`Campaign broadcasted successfully! Reach: ${res.actualReach} users.`)
      loadData()
    } else {
      toast.error(res.error || 'Failed to dispatch campaign broadcast.')
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Broadcast campaigns</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Configure segmented marketing campaigns across email, SMS, and WhatsApp.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Campaign wizard Form */}
        <div className="bg-white dark:bg-gray-950 p-5 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm h-fit">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">Create Campaign Draft</h3>
          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Campaign Name</label>
              <input
                type="text"
                placeholder="e.g. Monsoon Offer 2026"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full text-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-850 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Description</label>
              <input
                type="text"
                placeholder="Premium members discount promo"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full text-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-850 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Select Template</label>
              <select
                value={form.templateId}
                onChange={(e) => setForm({ ...form, templateId: e.target.value })}
                className="w-full text-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
              >
                <option value="">-- Choose Template --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.channel.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-gray-50 dark:border-gray-900 pt-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Target Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full text-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
                >
                  <option value="all">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Target Verification</label>
                <select
                  value={form.verified}
                  onChange={(e) => setForm({ ...form, verified: e.target.value })}
                  className="w-full text-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
                >
                  <option value="all">All statuses</option>
                  <option value="true">Verified Profiles Only</option>
                  <option value="false">Unverified Profiles Only</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 px-5 py-2.5 text-xs font-semibold text-white bg-rose-500 rounded-xl hover:bg-rose-600 cursor-pointer shadow-sm"
            >
              Create Campaign Draft
            </button>
          </form>
        </div>

        {/* Campaigns List */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-950 p-5 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">Broadcast campaigns List</h3>
          {loading ? (
            <div className="text-center text-xs py-10 text-gray-400">Loading list...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center text-xs py-10 text-gray-400">No campaigns created yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-900 text-gray-500">
                    <th className="py-2">Campaign Name</th>
                    <th className="py-2">Channel</th>
                    <th className="py-2">Est. Reach</th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                      <td className="py-3 font-semibold text-gray-900 dark:text-white">
                        <div>
                          {c.name}
                          <p className="text-[10px] font-normal text-gray-500 dark:text-gray-400 mt-0.5">{c.description || 'No description.'}</p>
                        </div>
                      </td>
                      <td className="py-3 text-gray-500 dark:text-gray-400 uppercase">{c.channel}</td>
                      <td className="py-3 font-medium text-gray-700 dark:text-gray-300">{c.estimated_reach} users</td>
                      <td className="py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          c.status === 'completed'
                            ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                            : c.status === 'processing'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 animate-pulse'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {c.status === 'draft' && (
                          <button
                            type="button"
                            onClick={() => handleBroadcast(c.id)}
                            className="px-3 py-1 bg-rose-500 text-white rounded text-[10px] font-semibold cursor-pointer hover:bg-rose-600"
                          >
                            Broadcast Now
                          </button>
                        )}
                        {c.status === 'completed' && (
                          <span className="text-[10px] text-gray-400">
                            Sent: {c.total_sent} | Fail: {c.total_failed}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
