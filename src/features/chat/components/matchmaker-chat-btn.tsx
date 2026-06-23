'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createChatRoom } from '@/features/chat/actions/chat-actions'
import { toast } from 'sonner'

interface MatchmakerChatBtnProps {
  associateId: string
  associateName: string
  className?: string
}

export function MatchmakerChatBtn({ associateId, associateName, className }: MatchmakerChatBtnProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleOpenChat = async () => {
    setIsLoading(true)
    try {
      const result = await createChatRoom({
        recipientId: associateId,
        type: 'user_to_associate',
      })

      if (result.error) {
        toast.error(`Could not open chat: ${result.error}`)
        return
      }

      if (result.data?.id) {
        router.push(`/chat?room_id=${result.data.id}`)
      }
    } catch {
      toast.error('Failed to connect to matchmaker chat. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleOpenChat}
      disabled={isLoading}
      className={`bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm flex items-center gap-2 ${className || ''}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <MessageCircle className="h-4 w-4" />
          Chat with {associateName}
        </>
      )}
    </Button>
  )
}
