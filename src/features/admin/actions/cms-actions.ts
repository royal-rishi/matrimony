'use server'

import { getAdminSession, logAdminActivity } from './helper'
import { savePageSchema, saveBlogSchema, saveTemplateSchema } from '../validators/admin-validators'
import { revalidatePath } from 'next/cache'

// Page Builder
export async function getCMSPages() {
  try {
    const { supabase } = await getAdminSession('manage_content')
    const { data, error } = await supabase.from('cms_pages').select('*').order('id', { ascending: true })
    if (error) throw error
    return { success: true, data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function saveCMSPage(input: any) {
  try {
    const { supabase, user } = await getAdminSession('manage_content')
    const validated = savePageSchema.parse(input)

    const { data: existing } = await supabase.from('cms_pages').select('*').eq('id', validated.id).single()

    const version = existing ? Number(existing.version) + 1 : 1

    const { data, error } = await supabase
      .from('cms_pages')
      .upsert({
        id: validated.id,
        title: validated.title,
        content: validated.content,
        status: validated.status,
        meta_title: validated.metaTitle || null,
        meta_description: validated.metaDescription || null,
        og_tags: validated.ogTags || {},
        canonical_url: validated.canonicalUrl || null,
        version,
        published_at: validated.status === 'published' ? new Date().toISOString() : (existing?.published_at || null),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Log version history
    await supabase.from('cms_version_history').insert({
      entity_type: 'page',
      entity_id: validated.id,
      version,
      content: validated.content,
      edited_by: user.id
    })

    await logAdminActivity(supabase, user.id, 'CMS Page Saved', 'cms_pages', null, existing || {}, data)
    revalidatePath(`/admin/content`)

    return { success: true, data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// Blogs Management
export async function getCMSBlogs() {
  try {
    const { supabase } = await getAdminSession('manage_content')
    const { data, error } = await supabase.from('cms_blogs').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return { success: true, data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function saveCMSBlog(input: any) {
  try {
    const { supabase, user } = await getAdminSession('manage_content')
    const validated = saveBlogSchema.parse(input)

    let res
    if (validated.id) {
      res = await supabase
        .from('cms_blogs')
        .update({
          slug: validated.slug,
          title: validated.title,
          summary: validated.summary || null,
          content: validated.content,
          featured_image: validated.featuredImage || null,
          status: validated.status,
          category: validated.category || null,
          tags: validated.tags,
          is_featured: validated.isFeatured,
          meta_title: validated.metaTitle || null,
          meta_description: validated.metaDescription || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', validated.id)
        .select()
        .single()
    } else {
      res = await supabase
        .from('cms_blogs')
        .insert({
          slug: validated.slug,
          title: validated.title,
          summary: validated.summary || null,
          content: validated.content,
          featured_image: validated.featuredImage || null,
          status: validated.status,
          category: validated.category || null,
          tags: validated.tags,
          is_featured: validated.isFeatured,
          meta_title: validated.metaTitle || null,
          meta_description: validated.metaDescription || null,
          author_id: user.id
        })
        .select()
        .single()
    }

    if (res.error) throw res.error

    await logAdminActivity(supabase, user.id, validated.id ? 'CMS Blog Updated' : 'CMS Blog Created', 'cms_blogs', res.data.id, {}, res.data)
    revalidatePath(`/admin/content`)

    return { success: true, data: res.data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// Media Library
export async function getCMSMedia() {
  try {
    const { supabase } = await getAdminSession('manage_content')
    const { data, error } = await supabase.from('cms_media').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return { success: true, data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function uploadMediaMeta(meta: {
  fileName: string
  fileUrl: string
  fileType: 'image' | 'video' | 'document' | 'icon' | 'banner'
  sizeBytes: number
}) {
  try {
    const { supabase, user } = await getAdminSession('manage_content')

    const { data, error } = await supabase
      .from('cms_media')
      .insert({
        file_name: meta.fileName,
        file_url: meta.fileUrl,
        file_type: meta.fileType,
        size_bytes: meta.sizeBytes,
        uploaded_by: user.id
      })
      .select()
      .single()

    if (error) throw error

    await logAdminActivity(supabase, user.id, 'CMS Media Meta Uploaded', 'cms_media', data.id, {}, data)
    return { success: true, data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// Templates
export async function getCMSTemplates() {
  try {
    const { supabase } = await getAdminSession('manage_content')
    const { data, error } = await supabase.from('cms_templates').select('*').order('id', { ascending: true })
    if (error) throw error
    return { success: true, data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function saveCMSTemplate(input: any) {
  try {
    const { supabase, user } = await getAdminSession('manage_content')
    const validated = saveTemplateSchema.parse(input)

    const { data, error } = await supabase
      .from('cms_templates')
      .upsert({
        id: validated.id,
        type: validated.type,
        subject: validated.subject || null,
        body: validated.body,
        status: validated.status,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    await logAdminActivity(supabase, user.id, 'CMS Template Saved', 'cms_templates', null, {}, data)
    revalidatePath(`/admin/content`)

    return { success: true, data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// Announcements
export async function getCMSAnnouncements() {
  try {
    const { supabase } = await getAdminSession('manage_content')
    const { data, error } = await supabase.from('cms_announcements').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return { success: true, data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function saveCMSAnnouncement(announcement: any) {
  try {
    const { supabase, user } = await getAdminSession('manage_content')

    let res
    if (announcement.id) {
      res = await supabase
        .from('cms_announcements')
        .update({
          type: announcement.type,
          title: announcement.title,
          message: announcement.message,
          banner_url: announcement.banner_url || null,
          link_url: announcement.link_url || null,
          starts_at: announcement.starts_at || null,
          ends_at: announcement.ends_at || null,
          is_active: announcement.is_active !== undefined ? announcement.is_active : true,
        })
        .eq('id', announcement.id)
        .select()
        .single()
    } else {
      res = await supabase
        .from('cms_announcements')
        .insert({
          type: announcement.type,
          title: announcement.title,
          message: announcement.message,
          banner_url: announcement.banner_url || null,
          link_url: announcement.link_url || null,
          starts_at: announcement.starts_at || null,
          ends_at: announcement.ends_at || null,
          is_active: announcement.is_active !== undefined ? announcement.is_active : true,
        })
        .select()
        .single()
    }

    if (res.error) throw res.error

    await logAdminActivity(supabase, user.id, announcement.id ? 'CMS Announcement Updated' : 'CMS Announcement Created', 'cms_announcements', res.data.id, {}, res.data)
    revalidatePath(`/admin/content`)

    return { success: true, data: res.data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
