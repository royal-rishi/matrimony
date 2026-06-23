'use client'

import { Heart } from 'lucide-react'

interface TypingIndicatorProps {
  userName?: string
}

export function TypingIndicator({ userName }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
        <div className="flex gap-1 items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" />
        </div>
      </div>
      {userName && (
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">
          {userName} is typing...
        </span>
      )}
    </div>
  )
}

interface ChatEmptyStateProps {
  title?: string
  description?: string
}

export function ChatEmptyState({
  title = 'Select a Conversation',
  description = 'Choose from your matched connections to start chatting.',
}: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-pink-100 dark:bg-pink-950/30 rounded-full scale-150 blur-xl opacity-40" />
        <div className="relative bg-gradient-to-tr from-pink-500 to-rose-400 p-5 rounded-full text-white shadow-lg">
          <Heart className="h-10 w-10 fill-pink-100/20 text-white" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 font-heading mb-2">
        {title}
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
        {description}
      </p>
    </div>
  )
}

export function ChatLoadingState() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-11 h-11 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-3 w-2/3 bg-zinc-100 dark:bg-zinc-900 rounded-md" />
          </div>
          <div className="h-3 w-10 bg-zinc-100 dark:bg-zinc-900 rounded-md shrink-0" />
        </div>
      ))}
    </div>
  )
}

export function MessageLoadingState() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={`flex items-end gap-2 animate-pulse ${i % 3 === 0 ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
          <div
            className={`h-10 rounded-2xl bg-zinc-200 dark:bg-zinc-800 ${
              i % 3 === 0 ? 'w-32 rounded-br-sm' : 'w-48 rounded-bl-sm'
            }`}
          />
        </div>
      ))}
    </div>
  )
}
