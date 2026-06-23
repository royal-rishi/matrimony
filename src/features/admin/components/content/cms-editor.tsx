'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  getCMSPages,
  saveCMSPage,
  getCMSBlogs,
  saveCMSBlog,
  getCMSMedia,
  getCMSTemplates,
  saveCMSTemplate,
  getCMSAnnouncements,
  saveCMSAnnouncement
} from '@/features/admin/actions/cms-actions'
import { toast } from 'sonner'
import { Plus, Globe, FileCode, Image as ImageIcon, Bell, Save, Copy } from 'lucide-react'

export function CMSEditor() {
  const [activeTab, setActiveTab] = useState<'pages' | 'blogs' | 'templates' | 'media' | 'announcements'>('pages')
  const [loading, setLoading] = useState(true)

  // Data lists
  const [pages, setPages] = useState<any[]>([])
  const [blogs, setBlogs] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [media, setMedia] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])

  // Edit Forms States
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formType, setFormType] = useState<string>('') // 'page', 'blog', 'template', 'announcement'

  const loadCMSData = useCallback(async () => {
    setLoading(true)
    if (activeTab === 'pages') {
      const res = await getCMSPages()
      if (res.success) setPages(res.data || [])
    } else if (activeTab === 'blogs') {
      const res = await getCMSBlogs()
      if (res.success) setBlogs(res.data || [])
    } else if (activeTab === 'templates') {
      const res = await getCMSTemplates()
      if (res.success) setTemplates(res.data || [])
    } else if (activeTab === 'media') {
      const res = await getCMSMedia()
      if (res.success) setMedia(res.data || [])
    } else if (activeTab === 'announcements') {
      const res = await getCMSAnnouncements()
      if (res.success) setAnnouncements(res.data || [])
    }
    setLoading(false)
  }, [activeTab])

  useEffect(() => {
    loadCMSData()
  }, [loadCMSData])

  const handlePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await saveCMSPage({
      id: editingItem.id,
      title: editingItem.title,
      content: editingItem.content || {},
      status: editingItem.status || 'draft',
      metaTitle: editingItem.meta_title || '',
      metaDescription: editingItem.meta_description || '',
      canonicalUrl: editingItem.canonical_url || '',
    })

    if (res.success) {
      toast.success('Page contents saved successfully!')
      setEditingItem(null)
      loadCMSData()
    } else {
      toast.error(res.error || 'Failed to save page')
    }
  }

  const handleBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await saveCMSBlog({
      id: editingItem.id,
      slug: editingItem.slug,
      title: editingItem.title,
      summary: editingItem.summary || '',
      content: editingItem.content || '',
      featuredImage: editingItem.featured_image || '',
      status: editingItem.status || 'draft',
      category: editingItem.category || '',
      tags: editingItem.tags || [],
      isFeatured: editingItem.is_featured || false,
    })

    if (res.success) {
      toast.success('Blog entry saved successfully!')
      setEditingItem(null)
      loadCMSData()
    } else {
      toast.error(res.error || 'Failed to save blog')
    }
  }

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await saveCMSTemplate({
      id: editingItem.id,
      type: editingItem.type,
      subject: editingItem.subject || '',
      body: editingItem.body,
      status: editingItem.status || 'active',
    })

    if (res.success) {
      toast.success('Notification template updated successfully!')
      setEditingItem(null)
      loadCMSData()
    } else {
      toast.error(res.error || 'Failed to save template')
    }
  }

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await saveCMSAnnouncement(editingItem)
    if (res.success) {
      toast.success('Announcement settings saved!')
      setEditingItem(null)
      loadCMSData()
    } else {
      toast.error(res.error || 'Failed to save announcement')
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('Media URL copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
          CMS Portal Editor
        </h1>
        <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-wider">
          Publish blog posts, edit page layouts content JSONs, and manage media library tags.
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-6 text-xs font-semibold">
        <button
          onClick={() => { setActiveTab('pages'); setEditingItem(null); }}
          className={`pb-2.5 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'pages' ? 'border-b-2 border-pink-500 text-pink-500 font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Globe size={14} /> Static Pages
        </button>
        <button
          onClick={() => { setActiveTab('blogs'); setEditingItem(null); }}
          className={`pb-2.5 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'blogs' ? 'border-b-2 border-pink-500 text-pink-500 font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Plus size={14} /> Marketing Blogs
        </button>
        <button
          onClick={() => { setActiveTab('templates'); setEditingItem(null); }}
          className={`pb-2.5 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'templates' ? 'border-b-2 border-pink-500 text-pink-500 font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <FileCode size={14} /> Templates Engine
        </button>
        <button
          onClick={() => { setActiveTab('media'); setEditingItem(null); }}
          className={`pb-2.5 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'media' ? 'border-b-2 border-pink-500 text-pink-500 font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <ImageIcon size={14} /> Media Library
        </button>
        <button
          onClick={() => { setActiveTab('announcements'); setEditingItem(null); }}
          className={`pb-2.5 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'announcements' ? 'border-b-2 border-pink-500 text-pink-500 font-bold' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Bell size={14} /> Announcements Banners
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: List of documents depending on tab */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 p-4 shadow-sm h-fit space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">
              Available Items ({loading ? '...' : activeTab === 'pages' ? pages.length : activeTab === 'blogs' ? blogs.length : activeTab === 'templates' ? templates.length : activeTab === 'media' ? media.length : announcements.length})
            </h3>
            {activeTab === 'blogs' && (
              <button
                onClick={() => {
                  setEditingItem({ slug: '', title: '', content: '', tags: [], is_featured: false, status: 'draft' })
                  setFormType('blog')
                }}
                className="text-[10px] font-bold text-pink-500 uppercase tracking-wider hover:underline"
              >
                + New Blog
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1 text-xs">
            {loading ? (
              <p className="text-center text-gray-400 py-6">Loading CMS assets...</p>
            ) : activeTab === 'pages' ? (
              pages.map((p) => (
                <div
                  key={p.id}
                  onClick={() => { setEditingItem(p); setFormType('page'); }}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    editingItem?.id === p.id ? 'border-pink-500 bg-pink-500/5 text-pink-500 font-bold' : 'border-gray-100 dark:border-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  <span className="block font-bold">{p.title}</span>
                  <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Route: /{p.id === 'home' ? '' : p.id} | Ver: v{p.version}</span>
                </div>
              ))
            ) : activeTab === 'blogs' ? (
              blogs.map((b) => (
                <div
                  key={b.id}
                  onClick={() => { setEditingItem(b); setFormType('blog'); }}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    editingItem?.id === b.id ? 'border-pink-500 bg-pink-500/5 text-pink-500 font-bold' : 'border-gray-100 dark:border-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  <span className="block font-bold truncate">{b.title}</span>
                  <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{b.status} | Slug: {b.slug}</span>
                </div>
              ))
            ) : activeTab === 'templates' ? (
              templates.map((t) => (
                <div
                  key={t.id}
                  onClick={() => { setEditingItem(t); setFormType('template'); }}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    editingItem?.id === t.id ? 'border-pink-500 bg-pink-500/5 text-pink-500 font-bold' : 'border-gray-100 dark:border-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  <span className="block font-bold">{t.id}</span>
                  <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Channel: {t.type} | {t.status}</span>
                </div>
              ))
            ) : activeTab === 'media' ? (
              media.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleCopyUrl(m.file_url)}
                  className="p-3 rounded-xl border border-gray-100 dark:border-gray-900 hover:bg-gray-50/50 transition cursor-pointer flex justify-between items-center group"
                >
                  <div className="truncate pr-4">
                    <span className="block font-bold truncate text-gray-700 dark:text-gray-200">{m.file_name}</span>
                    <span className="block text-[9px] text-gray-400 font-bold uppercase mt-0.5">{m.file_type} | {(Number(m.size_bytes) / 1024).toFixed(1)} KB</span>
                  </div>
                  <Copy size={13} className="text-gray-400 group-hover:text-pink-500 shrink-0" />
                </div>
              ))
            ) : (
              announcements.map((a) => (
                <div
                  key={a.id}
                  onClick={() => { setEditingItem(a); setFormType('announcement'); }}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    editingItem?.id === a.id ? 'border-pink-500 bg-pink-500/5 text-pink-500' : 'border-gray-100 dark:border-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  <span className="block font-bold truncate">{a.title}</span>
                  <span className="block text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{a.type} | active: {a.is_active ? 'yes' : 'no'}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Form editing block */}
        <div className="lg:col-span-2 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-sm">
          {editingItem ? (
            <>
              {formType === 'page' && (
                <form onSubmit={handlePageSubmit} className="space-y-4 text-xs">
                  <h3 className="text-sm font-black border-b border-gray-100 pb-2 uppercase tracking-wider mb-4 flex justify-between items-center">
                    <span>Edit Page Modules: {editingItem.title}</span>
                    <button type="submit" className="px-3 py-1.5 bg-pink-500 text-white rounded-lg flex items-center gap-1.5 cursor-pointer font-bold">
                      <Save size={12} /> Save Page Content
                    </button>
                  </h3>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Page Content JSON Configuration</label>
                    <textarea
                      value={JSON.stringify(editingItem.content, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value)
                          setEditingItem({ ...editingItem, content: parsed })
                        } catch {
                          // Ignore parsing error while editing
                        }
                      }}
                      className="w-full h-80 font-mono text-[11px] p-4 border border-gray-200 dark:border-gray-850 rounded-xl bg-slate-900 text-slate-100"
                    />
                  </div>
                </form>
              )}

              {formType === 'blog' && (
                <form onSubmit={handleBlogSubmit} className="space-y-4 text-xs">
                  <h3 className="text-sm font-black border-b border-gray-100 pb-2 uppercase tracking-wider mb-4 flex justify-between items-center">
                    <span>Write/Edit Blog Entry</span>
                    <button type="submit" className="px-3 py-1.5 bg-pink-500 text-white rounded-lg flex items-center gap-1.5 cursor-pointer font-bold">
                      <Save size={12} /> Save Blog Entry
                    </button>
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Title</label>
                      <input
                        type="text"
                        value={editingItem.title || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Slug</label>
                      <input
                        type="text"
                        value={editingItem.slug || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, slug: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Blog Summary</label>
                    <input
                      type="text"
                      value={editingItem.summary || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, summary: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Article Content Content Body</label>
                    <textarea
                      value={editingItem.content || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                      className="w-full h-44 px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Category</label>
                      <input
                        type="text"
                        value={editingItem.category || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Article Status</label>
                      <select
                        value={editingItem.status || 'draft'}
                        onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                </form>
              )}

              {formType === 'template' && (
                <form onSubmit={handleTemplateSubmit} className="space-y-4 text-xs">
                  <h3 className="text-sm font-black border-b border-gray-100 pb-2 uppercase tracking-wider mb-4 flex justify-between items-center">
                    <span>Edit Template Code: {editingItem.id}</span>
                    <button type="submit" className="px-3 py-1.5 bg-pink-500 text-white rounded-lg flex items-center gap-1.5 cursor-pointer font-bold">
                      <Save size={12} /> Save Template
                    </button>
                  </h3>
                  {editingItem.type === 'email' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Subject</label>
                      <input
                        type="text"
                        value={editingItem.subject || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Template Body Markup</label>
                    <textarea
                      value={editingItem.body || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, body: e.target.value })}
                      className="w-full h-64 font-mono text-[11px] p-4 border border-gray-200 dark:border-gray-850 rounded-xl bg-slate-900 text-slate-100"
                      required
                    />
                  </div>
                </form>
              )}

              {formType === 'announcement' && (
                <form onSubmit={handleAnnouncementSubmit} className="space-y-4 text-xs">
                  <h3 className="text-sm font-black border-b border-gray-100 pb-2 uppercase tracking-wider mb-4 flex justify-between items-center">
                    <span>Edit Banner Notice</span>
                    <button type="submit" className="px-3 py-1.5 bg-pink-500 text-white rounded-lg flex items-center gap-1.5 cursor-pointer font-bold">
                      <Save size={12} /> Save Announcement
                    </button>
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Title</label>
                      <input
                        type="text"
                        value={editingItem.title || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Banner Type</label>
                      <select
                        value={editingItem.type || 'site_announcement'}
                        onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent"
                      >
                        <option value="site_announcement">Site Announcement</option>
                        <option value="maintenance_notice">Maintenance Notice</option>
                        <option value="festival_banner">Festival Banner</option>
                        <option value="marketing_banner">Marketing Banner</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Display Message</label>
                    <textarea
                      value={editingItem.message || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, message: e.target.value })}
                      className="w-full h-20 px-3 py-2 border border-gray-200 dark:border-gray-850 rounded-lg bg-transparent"
                      required
                    />
                  </div>

                  <div className="flex gap-4 items-center">
                    <input
                      type="checkbox"
                      id="isAnnouncementActive"
                      checked={editingItem.is_active || false}
                      onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })}
                    />
                    <label htmlFor="isAnnouncementActive" className="text-[10px] font-bold text-gray-400 uppercase cursor-pointer">
                      Make Announcement Live
                    </label>
                  </div>
                </form>
              )}
            </>
          ) : (
            <p className="text-center text-xs text-gray-400 py-24">Select an asset from queue list to edit contents.</p>
          )}
        </div>
      </div>
    </div>
  )
}
