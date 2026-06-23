'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Send,
  Paperclip,
  Heart,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { sendMessage } from '../actions/chat-actions'
import type { MessageType } from '@/types/database'

interface MessageInputProps {
  roomId: string
  onMessageSent: () => void
  onTyping: (isTyping: boolean) => void
  disabled?: boolean
}

interface PendingAttachment {
  file: File
  previewUrl: string
  type: 'image' | 'document'
}

export function MessageInput({ roomId, onMessageSent, onTyping, disabled }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleTyping = useCallback(() => {
    onTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000)
  }, [onTyping])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    handleTyping()
    // Auto-resize
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ALLOWED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!ALLOWED.includes(file.type)) {
      toast.error('File type not permitted.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum 10MB.')
      return
    }

    const isImage = file.type.startsWith('image/')
    const previewUrl = isImage ? URL.createObjectURL(file) : ''
    setPendingAttachment({ file, previewUrl, type: isImage ? 'image' : 'document' })
    e.target.value = ''
  }

  const uploadAttachment = async (roomId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('roomId', roomId)

    const response = await fetch('/api/chat/upload', {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Upload failed.')
    }
    return response.json() as Promise<{
      filePath: string
      fileName: string
      fileSize: number
      mimeType: string
    }>
  }

  const handleSend = async () => {
    const trimmedContent = content.trim()
    if (!trimmedContent && !pendingAttachment) return
    if (isSending || isUploading || disabled) return

    setIsSending(true)
    onTyping(false)

    try {
      let messageType: MessageType = 'text'
      let finalContent = trimmedContent || ''
      let metadata: Record<string, unknown> | undefined

      // If there's an attachment, upload it first
      if (pendingAttachment) {
        setIsUploading(true)
        const uploadResult = await uploadAttachment(roomId, pendingAttachment.file)
        setIsUploading(false)
        messageType = pendingAttachment.type === 'image' ? 'image' : 'document'
        finalContent = trimmedContent || messageType
        metadata = {
          attachment: {
            filePath: uploadResult.filePath,
            fileName: uploadResult.fileName,
            fileSize: uploadResult.fileSize,
            mimeType: uploadResult.mimeType,
          },
        }
        if (pendingAttachment.previewUrl) {
          URL.revokeObjectURL(pendingAttachment.previewUrl)
        }
        setPendingAttachment(null)
      }

      if (!finalContent) return

      const result = await sendMessage({
        roomId,
        content: finalContent,
        messageType,
        metadata,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        setContent('')
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
        onMessageSent()
      }
    } catch {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
      setIsUploading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const removePendingAttachment = () => {
    if (pendingAttachment?.previewUrl) {
      URL.revokeObjectURL(pendingAttachment.previewUrl)
    }
    setPendingAttachment(null)
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200/60 dark:border-zinc-800/60 p-3">
      {/* Attachment Preview */}
      {pendingAttachment && (
        <div className="mb-2 flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-2.5 pr-3">
          {pendingAttachment.type === 'image' ? (
            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingAttachment.previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-rose-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
              {pendingAttachment.file.name}
            </p>
            <p className="text-[10px] text-zinc-400">
              {(pendingAttachment.file.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={removePendingAttachment}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Input Row */}
      <div className="flex items-end gap-2">
        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isSending}
          className="p-2 rounded-xl text-zinc-400 hover:text-[#E91E63] hover:bg-pink-50 dark:hover:bg-pink-950/20 transition-colors disabled:opacity-40"
          aria-label="Attach file"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[#E91E63]" />
          ) : pendingAttachment?.type === 'image' ? (
            <ImageIcon className="h-5 w-5 text-[#E91E63]" />
          ) : (
            <Paperclip className="h-5 w-5" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || isSending}
            rows={1}
            placeholder={disabled ? 'Chat unavailable' : 'Type a message... (Enter to send)'}
            className="w-full resize-none text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 rounded-2xl px-4 py-2.5 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20 focus:border-[#E91E63] transition-all leading-relaxed"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={(!content.trim() && !pendingAttachment) || isSending || disabled}
          className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-sm hover:from-pink-600 hover:to-rose-600 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          {isSending ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : content.trim() || pendingAttachment ? (
            <Send className="h-4.5 w-4.5" />
          ) : (
            <Heart className="h-4.5 w-4.5 fill-white/40" />
          )}
        </button>
      </div>
    </div>
  )
}
