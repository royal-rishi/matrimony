import { NextResponse } from 'next/server'
import {
  getCMSPages,
  saveCMSPage,
  getCMSBlogs,
  saveCMSBlog,
  getCMSMedia,
  uploadMediaMeta,
  getCMSTemplates,
  saveCMSTemplate,
  getCMSAnnouncements,
  saveCMSAnnouncement
} from '@/features/admin/actions/cms-actions'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'pages', 'blogs', 'media', 'templates', 'announcements'

  if (type === 'pages') {
    const res = await getCMSPages()
    return NextResponse.json(res, { status: res.success ? 200 : 400 })
  }
  if (type === 'blogs') {
    const res = await getCMSBlogs()
    return NextResponse.json(res, { status: res.success ? 200 : 400 })
  }
  if (type === 'media') {
    const res = await getCMSMedia()
    return NextResponse.json(res, { status: res.success ? 200 : 400 })
  }
  if (type === 'templates') {
    const res = await getCMSTemplates()
    return NextResponse.json(res, { status: res.success ? 200 : 400 })
  }
  if (type === 'announcements') {
    const res = await getCMSAnnouncements()
    return NextResponse.json(res, { status: res.success ? 200 : 400 })
  }

  return NextResponse.json({ success: false, error: 'Invalid content type' }, { status: 400 })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'pages') {
      const res = await saveCMSPage(body)
      return NextResponse.json(res, { status: res.success ? 200 : 400 })
    }
    if (type === 'blogs') {
      const res = await saveCMSBlog(body)
      return NextResponse.json(res, { status: res.success ? 200 : 400 })
    }
    if (type === 'media') {
      const res = await uploadMediaMeta(body)
      return NextResponse.json(res, { status: res.success ? 200 : 400 })
    }
    if (type === 'templates') {
      const res = await saveCMSTemplate(body)
      return NextResponse.json(res, { status: res.success ? 200 : 400 })
    }
    if (type === 'announcements') {
      const res = await saveCMSAnnouncement(body)
      return NextResponse.json(res, { status: res.success ? 200 : 400 })
    }

    return NextResponse.json({ success: false, error: 'Invalid content type' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 400 })
  }
}
