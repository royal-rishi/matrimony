'use client'

import { stopImpersonatingAction } from '@/features/admin/actions/impersonate-actions'
import { toast } from 'sonner'
import { ShieldAlert, LogOut } from 'lucide-react'

interface ImpersonationBannerProps {
  userName: string
  adminId: string
}

export function ImpersonationBanner({ userName, adminId }: ImpersonationBannerProps) {
  const handleStop = async () => {
    const toastId = toast.loading('Ending impersonation session...')
    const res = await stopImpersonatingAction()
    toast.dismiss(toastId)
    if (res.success) {
      toast.success('Impersonation ended.')
      window.location.href = '/admin/users'
    } else {
      toast.error(res.error || 'Failed to stop impersonation')
    }
  }

  return (
    <div className="w-full bg-amber-500 text-slate-950 px-4 py-2 flex items-center justify-between text-xs font-semibold shadow-md z-[9999] relative border-b border-amber-600">
      <div className="flex items-center gap-2">
        <ShieldAlert size={16} className="text-slate-950 shrink-0" />
        <span>
          Impersonation Session: Viewing platform as <span className="font-black underline">{userName}</span> (Admin ID: {adminId.substring(0, 8)})
        </span>
      </div>
      <button
        onClick={handleStop}
        className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 text-white rounded-lg hover:bg-slate-900 transition font-bold shadow-sm cursor-pointer"
      >
        <LogOut size={12} />
        Stop Impersonating
      </button>
    </div>
  )
}
