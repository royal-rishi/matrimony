import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.vbs', '.msi', '.dmg', '.app', '.ps1']

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const roomId = formData.get('roomId') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    if (!roomId) return NextResponse.json({ error: 'Room ID is required.' }, { status: 400 })

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds the 10MB limit.' }, { status: 413 })
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not permitted.' }, { status: 415 })
    }

    // Validate extension
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: 'Executable files are not allowed.' }, { status: 415 })
    }

    // Verify the uploader is a room participant
    const { data: participant } = await supabase
      .from('chat_room_participants')
      .select('id')
      .eq('room_id', roomId)
      .eq('profile_id', user.id)
      .maybeSingle()

    if (!participant) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
    }

    // Upload to Supabase storage
    const fileBuffer = await file.arrayBuffer()
    const filePath = `${roomId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      filePath: uploadData.path,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    })
  } catch (err) {
    console.error('[/api/chat/upload]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
