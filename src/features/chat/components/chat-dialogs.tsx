'use client'

import { useState } from 'react'
import { AlertTriangle, ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { reportUser, blockUser } from '../actions/chat-actions'
import type { ChatReportReason } from '@/types/database'

// ---- Report Dialog ----

const REPORT_REASONS: { value: ChatReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam or unwanted messages' },
  { value: 'abuse', label: 'Abusive language' },
  { value: 'harassment', label: 'Harassment or threats' },
  { value: 'fake_profile', label: 'Fake or impersonation profile' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'scam', label: 'Scam or fraud attempt' },
]

interface ReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportedId: string
  reportedName: string
  roomId?: string
  messageId?: string
  messageCreatedAt?: string
}

export function ReportDialog({
  open,
  onOpenChange,
  reportedId,
  reportedName,
  roomId,
  messageId,
  messageCreatedAt,
}: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState<ChatReportReason | ''>('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason for the report.')
      return
    }

    setIsSubmitting(true)
    const result = await reportUser({
      reportedId,
      reason: selectedReason as ChatReportReason,
      description: description.trim() || undefined,
      roomId,
      messageId,
      messageCreatedAt,
    })
    setIsSubmitting(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Report submitted. Our team will review it shortly.')
      onOpenChange(false)
      setSelectedReason('')
      setDescription('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-zinc-900 dark:text-white">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Report {reportedName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Help us keep Rishtajodo safe. Select the issue you&apos;re experiencing.
          </p>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Reason</Label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  <input
                    type="radio"
                    name="report_reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={() => setSelectedReason(reason.value)}
                    className="h-4 w-4 text-rose-500 border-zinc-300 focus:ring-rose-500"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-desc" className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Additional details (optional)
            </Label>
            <textarea
              id="report-desc"
              rows={3}
              maxLength={1000}
              placeholder="Provide any additional context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason}
            className="bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:from-rose-700 hover:to-pink-700"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---- Block Dialog ----

interface BlockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetUserId: string
  targetName: string
  onConfirm: () => void
}

export function BlockDialog({
  open,
  onOpenChange,
  targetUserId,
  targetName,
  onConfirm,
}: BlockDialogProps) {
  const [isBlocking, setIsBlocking] = useState(false)

  const handleBlock = async () => {
    setIsBlocking(true)
    const result = await blockUser({ targetUserId })
    setIsBlocking(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${targetName} has been blocked.`)
      onOpenChange(false)
      onConfirm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-zinc-900 dark:text-white">
            <ShieldX className="h-5 w-5 text-rose-500" />
            Block {targetName}?
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Blocking <strong>{targetName}</strong> will:
          </p>
          <ul className="text-sm text-zinc-500 dark:text-zinc-400 space-y-1.5 list-disc list-inside">
            <li>Prevent them from sending you messages</li>
            <li>Hide your profile from their search results</li>
            <li>Remove any pending interests from this user</li>
          </ul>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            You can unblock users at any time from your settings.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isBlocking}>
            Cancel
          </Button>
          <Button
            onClick={handleBlock}
            disabled={isBlocking}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {isBlocking ? 'Blocking...' : 'Block User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
