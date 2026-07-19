'use client'

// ============================================================
// TEMPLATE EDITOR COMPONENT
// ============================================================

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createTemplate, updateTemplate, deleteTemplate, sendTest } from '../actions/admin-notifications.actions'
import { toast } from 'sonner'

export const TemplateEditor: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null)
  
  // Editor form values
  const [form, setForm] = useState({
    name: '',
    event: '',
    subject: '',
    body: '',
    channel: 'email',
    language: 'en',
  })

  // Test send form values
  const [testForm, setTestForm] = useState({
    templateId: '',
    channel: 'email',
    recipient: '',
    event: '',
    variables: '{}',
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('notification_templates')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setTemplates(data)
    setLoading(false)
  }

  const handleEditClick = (tpl: any) => {
    setEditingTemplate(tpl)
    setForm({
      name: tpl.name,
      event: tpl.event,
      subject: tpl.subject || '',
      body: tpl.body,
      channel: tpl.channel,
      language: tpl.language,
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.body || !form.event) {
      toast.error('Missing mandatory fields.')
      return
    }

    if (editingTemplate) {
      const res = await updateTemplate(editingTemplate.id, form)
      if (res.success) {
        toast.success('Template updated successfully.')
        setEditingTemplate(null)
        loadTemplates()
      } else {
        toast.error(res.error || 'Failed to update template.')
      }
    } else {
      const res = await createTemplate(form as any)
      if (res.success) {
        toast.success('Template created successfully.')
        setForm({ name: '', event: '', subject: '', body: '', channel: 'email', language: 'en' })
        loadTemplates()
      } else {
        toast.error(res.error || 'Failed to create template.')
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return
    }
    const res = await deleteTemplate(id)
    if (res.success) {
      toast.success('Template deleted successfully.')
      loadTemplates()
    } else {
      toast.error(res.error || 'Failed to delete template.')
    }
  }

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testForm.recipient || !testForm.event) {
      toast.error('Recipient and event key are mandatory.')
      return
    }

    let parsedVars = {}
    try {
      parsedVars = JSON.parse(testForm.variables)
    } catch {
      toast.error('Invalid variables JSON formatting.')
      return
    }

    const res = await sendTest(
      testForm.channel as any,
      testForm.recipient,
      testForm.event,
      parsedVars
    )

    if (res.success) {
      toast.success('Test notification sent successfully.')
      setTestForm({ ...testForm, recipient: '', variables: '{}' })
    } else {
      toast.error(res.error || 'Failed to send test notification.')
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Message Templates</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage transactional and marketing alert templates.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Editor Form */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-950 p-5 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm h-fit">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">
            {editingTemplate ? 'Edit Template' : 'Create New Template'}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Template Name</label>
              <input
                type="text"
                placeholder="e.g. Partner Recommendation Alert"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full text-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-850 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Channel</label>
                <select
                  value={form.channel}
                  onChange={(e) => setForm({ ...form, channel: e.target.value })}
                  className="w-full text-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Language</label>
                <select
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="w-full text-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-850 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Event Key</label>
              <input
                type="text"
                placeholder="e.g. associate.shared_match"
                value={form.event}
                onChange={(e) => setForm({ ...form, event: e.target.value })}
                className="w-full text-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-850 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
              />
            </div>

            {form.channel === 'email' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Subject (Email Only)</label>
                <input
                  type="text"
                  placeholder="e.g. We found new matches for you!"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full text-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-850 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Template Body</label>
              <textarea
                placeholder="Message body. Use {{user_name}}, {{otp}} variables."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={5}
                className="w-full text-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-850 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              {editingTemplate && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTemplate(null)
                    setForm({ name: '', event: '', subject: '', body: '', channel: 'email', language: 'en' })
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer dark:bg-gray-900 dark:border-gray-800 dark:text-white"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-500 rounded-xl hover:bg-rose-600 cursor-pointer"
              >
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>

        {/* Templates List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-950 p-5 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">Templates Registry</h3>
            {loading ? (
              <div className="text-center text-xs py-10 text-gray-400">Loading list...</div>
            ) : templates.length === 0 ? (
              <div className="text-center text-xs py-10 text-gray-400">No custom templates found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-900 text-gray-500">
                      <th className="py-2">Name</th>
                      <th className="py-2">Channel</th>
                      <th className="py-2">Event Key</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
                    {templates.map((tpl) => (
                      <tr key={tpl.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                        <td className="py-3 font-semibold text-gray-900 dark:text-white">
                          <div>
                            {tpl.name}
                            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1 py-0.5 rounded ml-2 uppercase dark:bg-gray-800">
                              {tpl.language}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-gray-500 dark:text-gray-400 uppercase">{tpl.channel}</td>
                        <td className="py-3 text-gray-500 dark:text-gray-400 font-mono text-[10px]">{tpl.event}</td>
                        <td className="py-3 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => handleEditClick(tpl)}
                            className="px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-[10px] font-semibold cursor-pointer dark:bg-gray-800 dark:text-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTestForm({
                                templateId: tpl.id,
                                channel: tpl.channel,
                                recipient: tpl.channel === 'email' ? 'rishi@example.com' : '+919999999999',
                                event: tpl.event,
                                variables: '{"user_name":"Tester", "otp":"123456"}',
                              })
                            }}
                            className="px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-[10px] font-semibold cursor-pointer dark:bg-rose-950/20 dark:text-rose-400"
                          >
                            Test
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(tpl.id)}
                            className="px-2 py-1 bg-red-50 text-red-650 hover:bg-red-100 rounded text-[10px] font-semibold cursor-pointer dark:bg-red-950/20 dark:text-red-400"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Test Sandbox panel */}
          {testForm.templateId && (
            <div className="bg-white dark:bg-gray-950 p-5 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm">
              <h3 className="text-sm font-bold text-gray-850 dark:text-gray-250 mb-3">Send Test message</h3>
              <form onSubmit={handleSendTest} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Recipient</label>
                    <input
                      type="text"
                      placeholder={testForm.channel === 'email' ? 'email@example.com' : '+91XXXXXXXXXX'}
                      value={testForm.recipient}
                      onChange={(e) => setTestForm({ ...testForm, recipient: e.target.value })}
                      className="w-full text-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-850 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Event Key</label>
                    <input
                      type="text"
                      value={testForm.event}
                      disabled
                      className="w-full text-xs rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-550 dark:border-gray-700 dark:bg-gray-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Dynamic Variables (JSON)</label>
                  <textarea
                    value={testForm.variables}
                    onChange={(e) => setTestForm({ ...testForm, variables: e.target.value })}
                    rows={3}
                    className="w-full text-xs font-mono rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-850 focus:border-rose-500 focus:outline-none dark:border-gray-700 dark:bg-gray-850 dark:text-white"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setTestForm({ ...testForm, templateId: '' })}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer dark:bg-gray-900 dark:border-gray-800 dark:text-white"
                  >
                    Close Test Panel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-rose-500 rounded-xl hover:bg-rose-600 cursor-pointer"
                  >
                    Send Test Notification
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
