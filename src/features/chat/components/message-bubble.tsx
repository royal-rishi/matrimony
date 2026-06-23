'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import {
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Undo2,
  MoreHorizontal,
  FileText,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import type { MessageWithAttachments } from '@/types/database'
import { recallMessage } from '../actions/chat-actions'

interface MessageBubbleProps {
  message: MessageWithAttachments
  isOwnMessage: boolean
  showAvatar: boolean
  onReport: (messageId: string, messageCreatedAt: string) => void
}

function MessageStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'sent':
      return <Check className="h-3 w-3 text-zinc-400" />
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-zinc-400" />
    case 'read':
      return <CheckCheck className="h-3 w-3 text-[#E91E63]" />
    case 'failed':
      return <AlertCircle className="h-3 w-3 text-red-500" />
    case 'recalled':
      return <Undo2 className="h-3 w-3 text-zinc-300" />
    default:
      return <Clock className="h-3 w-3 text-zinc-400" />
  }
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export function MessageBubble({
  message,
  isOwnMessage,
  showAvatar,
  onReport,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isRecalling, setIsRecalling] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isRecalled = message.status === 'recalled'

  const handleRecall = async () => {
    setIsRecalling(true)
    const result = await recallMessage(message.id)
    setIsRecalling(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Message recalled.')
    }
    setShowMenu(false)
  }

  const handleDownloadAttachment = (filePath: string, fileName: string) => {
    // Create a temporary anchor element for download
    const anchor = document.createElement('a')
    anchor.href = filePath
    anchor.download = fileName
    anchor.click()
  }

  return (
    <div
      className={`flex items-end gap-2 group ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {showAvatar ? (
        <div className="w-7 h-7 rounded-full shrink-0 overflow-hidden bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
          {message.sender?.avatar_url ? (
            <Image
              src={message.sender.avatar_url}
              alt={message.sender.first_name}
              width={28}
              height={28}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-white text-[10px] font-bold">
              {message.sender?.first_name?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>
      ) : (
        <div className="w-7 shrink-0" />
      )}

      {/* Bubble + Meta */}
      <div className={`relative max-w-[72%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        {/* Bubble */}
        <div
          className={`relative px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isRecalled
              ? 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-400 dark:text-zinc-500 italic border border-zinc-200/60 dark:border-zinc-700/60'
              : isOwnMessage
              ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-br-sm'
              : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60 rounded-bl-sm'
          }`}
        >
          {isRecalled ? (
            <span className="flex items-center gap-1.5">
              <Undo2 className="h-3.5 w-3.5" />
              This message was recalled
            </span>
          ) : message.message_type === 'image' && message.attachments.length > 0 ? (
            <div className="space-y-1.5">
              {message.attachments.map((att) => (
                <div key={att.id} className="rounded-xl overflow-hidden">
                  <Image
                    src={att.file_path}
                    alt={att.file_name}
                    width={240}
                    height={180}
                    className="object-cover w-full rounded-xl"
                  />
                </div>
              ))}
              {message.content && message.content !== 'image' && (
                <p className="mt-1">{message.content}</p>
              )}
            </div>
          ) : message.message_type === 'document' && message.attachments.length > 0 ? (
            <div className="space-y-1.5">
              {message.attachments.map((att) => (
                <button
                  key={att.id}
                  type="button"
                  onClick={() => handleDownloadAttachment(att.file_path, att.file_name)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-colors ${
                    isOwnMessage
                      ? 'border-white/30 bg-white/10 hover:bg-white/20'
                      : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <FileText className={`h-4 w-4 shrink-0 ${isOwnMessage ? 'text-white/80' : 'text-zinc-500'}`} />
                  <div className="text-left min-w-0">
                    <p className={`text-xs font-semibold truncate max-w-[160px] ${isOwnMessage ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {att.file_name}
                    </p>
                    <p className={`text-[10px] ${isOwnMessage ? 'text-white/60' : 'text-zinc-400'}`}>
                      {(att.file_size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <Download className={`h-3.5 w-3.5 shrink-0 ${isOwnMessage ? 'text-white/70' : 'text-zinc-400'}`} />
                </button>
              ))}
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>

        {/* Time + Status */}
        <div className={`flex items-center gap-1 px-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500" suppressHydrationWarning>
            {formatTime(message.created_at)}
          </span>
          {isOwnMessage && <MessageStatusIcon status={message.status} />}
        </div>

        {/* Context Menu Trigger */}
        {!isRecalled && (
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className={`absolute top-1 ${
              isOwnMessage ? '-left-6' : '-right-6'
            } opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800`}
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Context Menu */}
        {showMenu && !isRecalled && (
          <div
            ref={menuRef}
            className={`absolute top-6 z-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl py-1 min-w-[140px] ${
              isOwnMessage ? 'right-0' : 'left-0'
            }`}
          >
            {isOwnMessage && (
              <button
                type="button"
                onClick={handleRecall}
                disabled={isRecalling}
                className="w-full px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2"
              >
                <Undo2 className="h-3.5 w-3.5" />
                {isRecalling ? 'Recalling...' : 'Recall Message'}
              </button>
            )}
            {!isOwnMessage && (
              <button
                type="button"
                onClick={() => {
                  onReport(message.id, message.created_at)
                  setShowMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Report Message
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(message.content)
                toast.success('Copied to clipboard.')
                setShowMenu(false)
              }}
              className="w-full px-3 py-2 text-left text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Copy Text
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
