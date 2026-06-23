import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const query = searchParams.get('q')
    const cursor = searchParams.get('cursor')
    const limitParam = searchParams.get('limit')
    const limit = Math.min(parseInt(limitParam || '20', 10), 50)

    if (!roomId) return NextResponse.json({ error: 'roomId is required.' }, { status: 400 })
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Search query must be at least 2 characters.' }, { status: 400 })
    }

    // Verify the searcher is a room participant
    const { data: participant } = await supabase
      .from('chat_room_participants')
      .select('id')
      .eq('room_id', roomId)
      .eq('profile_id', user.id)
      .maybeSingle()

    if (!participant) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 })
    }

    // Search messages using ilike
    let dbQuery = supabase
      .from('messages')
      .select('id, room_id, sender_id, content, message_type, status, created_at')
      .eq('room_id', roomId)
      .eq('is_deleted', false)
      .neq('status', 'recalled')
      .ilike('content', `%${query.trim()}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (cursor) {
      dbQuery = dbQuery.lt('created_at', cursor)
    }

    const { data: messages, error: searchError } = await dbQuery

    if (searchError) return NextResponse.json({ error: searchError.message }, { status: 500 })

    type SearchMessage = {
      id: string
      room_id: string
      sender_id: string
      content: string
      message_type: string
      status: string
      created_at: string
    }

    const typedMessages = (messages || []) as unknown as SearchMessage[]
    const nextCursor = typedMessages.length === limit
      ? typedMessages[typedMessages.length - 1]?.created_at
      : null

    return NextResponse.json({ messages: typedMessages, nextCursor })
  } catch (err) {
    console.error('[/api/chat/search]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
