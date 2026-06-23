'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Trash2, Loader2, ImagePlus, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { uploadPhotoAction, deletePhotoAction } from '../actions/profile-actions'

interface ProfilePhotoUploaderProps {
  photos: string[]
  avatarUrl?: string | null
}

export function ProfilePhotoUploader({ photos = [], avatarUrl }: ProfilePhotoUploaderProps) {
  const [localPhotos, setLocalPhotos] = useState<string[]>(photos)
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null | undefined>(avatarUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file) return

    // Verify format and size limits
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Unsupported image format', {
        description: 'Please upload a JPEG, PNG, or WebP photo.',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Maximum profile photo upload limit is 5MB.',
      })
      return
    }

    setIsUploading(true)

    try {
      // 1. Client-Side Image Resize & Optimization using HTML5 Canvas
      const optimizedBase64 = await optimizeImage(file)
      
      // 2. Trigger Server Action to upload photo to Supabase
      const result = await uploadPhotoAction(optimizedBase64, file.name)

      if (result?.error) {
        toast.error('Upload failed', { description: result.error })
      } else if (result?.url) {
        // Optimistic update — show new photo immediately
        setLocalPhotos((prev) => [...prev, result.url!])
        if (!localAvatarUrl) setLocalAvatarUrl(result.url)
        toast.success('Photo uploaded successfully!')
        router.refresh() // Re-sync server data
      }
    } catch {
      toast.error('An unexpected error occurred during photo upload.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Resizes image client-side to maximum width 800px, quality 85%
  const optimizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 800
          let width = img.width
          let height = img.height

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width)
            width = MAX_WIDTH
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject('Could not build canvas context')
            return
          }

          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
          resolve(dataUrl)
        }
        img.onerror = () => reject('Could not load image')
      }
      reader.onerror = () => reject('FileReader error')
    })
  }

  const handleDeletePhoto = async (photoUrl: string) => {
    setDeletingUrl(photoUrl)
    try {
      const result = await deletePhotoAction(photoUrl)
      if (result?.error) {
        toast.error('Deletion failed', { description: result.error })
      } else {
        // Optimistic update — remove immediately from local state
        setLocalPhotos((prev) => prev.filter((p) => p !== photoUrl))
        if (localAvatarUrl === photoUrl) {
          const remaining = localPhotos.filter((p) => p !== photoUrl)
          setLocalAvatarUrl(remaining[0] || null)
        }
        toast.success('Photo removed successfully!')
        router.refresh()
      }
    } catch {
      toast.error('An unexpected error occurred deleting photo.')
    } finally {
      setDeletingUrl(null)
    }
  }


  return (
    <Card className="border-zinc-200/50 shadow-lg bg-white/95 dark:bg-zinc-900/95">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Camera className="h-5 w-5 text-rose-500" />
          Photos & Avatar Album
        </CardTitle>
        <CardDescription>
          Upload your photos. Matrimonial profiles with clear face photos receive 8x more interests. Max 5 photos allowed.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Verification Status Banner */}
        <div className="p-3.5 rounded-lg bg-emerald-50/50 text-emerald-800 text-xs border border-emerald-100 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">KYC Photo Vetting Enabled</span>
            <p className="text-zinc-500 mt-0.5">
              All photos are manually reviewed by your assigned Local Matchmaker before going live. Unverified photos remain blurred to other users.
            </p>
          </div>
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {localPhotos.map((photoUrl, idx) => (
            <div key={photoUrl + idx} className="relative group aspect-square rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 overflow-hidden shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt={`Profile photo ${idx + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              
              {/* Avatar Badge Indicator */}
              {localAvatarUrl === photoUrl && (
                <div className="absolute top-2 left-2 z-10 bg-[#E91E63] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase">
                  Main Photo
                </div>
              )}

              {/* Photo Action Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  onClick={() => handleDeletePhoto(photoUrl)}
                  disabled={deletingUrl === photoUrl}
                  className="rounded-full shadow-md"
                >
                  {deletingUrl === photoUrl ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ))}

          {/* Upload Card Trigger */}
          {localPhotos.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="aspect-square border-2 border-dashed border-zinc-200 hover:border-pink-500 rounded-xl flex flex-col items-center justify-center text-zinc-400 hover:text-pink-600 hover:bg-pink-50/10 transition-all duration-300"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
                  <span className="text-[10px] mt-1.5 font-semibold">Uploading...</span>
                </>
              ) : (
                <>
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-[10px] mt-1.5 font-semibold">Add Photo</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />

        {/* Privacy Note */}
        <div className="flex items-start gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg text-[11px] text-zinc-500">
          <ShieldAlert className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
          <span>
            Ensure your photo shows your face clearly. Group photos, cartoon pictures, or landscapes will be rejected by our verification team.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
