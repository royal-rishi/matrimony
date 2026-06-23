'use client'
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'
import { Check, X, ShieldAlert, MessageSquare, Briefcase, GraduationCap, Heart, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { respondToInterest } from '../actions/match-actions'

interface InterestRecord {
  id: string
  status: string
  initiated_by_id: string
  created_at: string
  other_profile: {
    id: string
    first_name: string
    last_name: string
    avatar_url: string | null
    city: string
    state: string
    religion: string
    occupation: string | null
    education: string | null
    date_of_birth: string
  }
}

interface InterestsClientProps {
  initialReceived: InterestRecord[]
  initialSent: InterestRecord[]
  initialAccepted: InterestRecord[]
  initialDeclined: InterestRecord[]
}

export function InterestsClient({
  initialReceived,
  initialSent,
  initialAccepted,
  initialDeclined
}: InterestsClientProps) {
  const [received, setReceived] = useState<InterestRecord[]>(initialReceived)
  const [sent] = useState<InterestRecord[]>(initialSent)
  const [accepted, setAccepted] = useState<InterestRecord[]>(initialAccepted)
  const [declined, setDeclined] = useState<InterestRecord[]>(initialDeclined)
  
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  // Respond to interest invite
  const handleResponse = async (matchId: string, status: 'accepted' | 'rejected') => {
    setIsProcessing(matchId)
    try {
      const result = await respondToInterest(matchId, status)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(status === 'accepted' ? 'Interest accepted! Chat unlocked.' : 'Interest declined.')
        
        // Find record and move it
        const record = received.find((r) => r.id === matchId)
        if (record) {
          setReceived((prev) => prev.filter((r) => r.id !== matchId))
          const updatedRecord = { ...record, status }
          if (status === 'accepted') {
            setAccepted((prev) => [updatedRecord, ...prev])
          } else {
            setDeclined((prev) => [updatedRecord, ...prev])
          }
        }
      }
    } catch {
      toast.error('Failed to respond to interest.')
    } finally {
      setIsProcessing(null)
    }
  }

  const getAge = (dob: string) => {
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const renderCardList = (list: InterestRecord[], type: 'received' | 'sent' | 'accepted' | 'declined') => {
    if (list.length === 0) {
      return (
        <div className="min-h-[300px] border border-dashed rounded-2xl flex flex-col items-center justify-center p-8 bg-white text-center shadow-sm">
          <Heart className="h-10 w-10 text-zinc-300 mb-2 stroke-[1.5px]" />
          <h3 className="font-bold text-zinc-700 text-sm">No Invites</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Nothing here at the moment.</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {list.map((rec) => {
          const p = rec.other_profile
          const age = getAge(p.date_of_birth)
          return (
            <Card key={rec.id} className="border border-zinc-200/50 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                
                {/* Profile Avatar and Details */}
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-zinc-100 border shrink-0">
                    <img src={p.avatar_url || '/logo/blurred-photo-placeholder.jpg'} alt={p.first_name} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-zinc-800 flex items-center gap-1.5">
                      {p.first_name} {p.last_name}
                      <span className="text-zinc-400 font-semibold" suppressHydrationWarning>• {age} yrs</span>
                    </h4>
                    <p className="text-[10px] text-pink-600 font-semibold">{p.religion} • {p.city}, {p.state}</p>
                    
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] text-zinc-450 mt-1.5">
                      <span className="flex items-center gap-1"><Briefcase className="h-3 w-3 text-zinc-400" /> {p.occupation || 'Self Employed'}</span>
                      <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3 text-zinc-400" /> {p.education || 'Bachelor\'s'}</span>
                    </div>
                  </div>
                </div>

                {/* Status or Interactive Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100 justify-end">
                  {type === 'received' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResponse(rec.id, 'rejected')}
                        disabled={isProcessing === rec.id}
                        className="border-zinc-200 text-xs font-semibold hover:bg-rose-50 hover:text-rose-600 h-9 px-3.5"
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Decline
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => handleResponse(rec.id, 'accepted')}
                        disabled={isProcessing === rec.id}
                        className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold h-9 px-4 shadow-sm"
                      >
                        {isProcessing === rec.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Accept Interest
                          </>
                        )}
                      </Button>
                    </>
                  )}

                  {type === 'sent' && (
                    <span className="text-xs font-bold text-zinc-400 flex items-center gap-1 bg-zinc-50 border p-1.5 rounded-lg">
                      <Clock className="h-3.5 w-3.5" />
                      Pending Approval
                    </span>
                  )}

                  {type === 'accepted' && (
                    <Link href="/chat">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 px-4 flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Start Secure Chat
                      </Button>
                    </Link>
                  )}

                  {type === 'declined' && (
                    <span className="text-xs font-bold text-zinc-400 flex items-center gap-1 bg-zinc-50 border p-1.5 rounded-lg">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Invite Declined
                    </span>
                  )}
                </div>

              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight font-heading">
          Matrimonial Interests Center
        </h1>
        <p className="text-xs text-zinc-500">
          Manage matrimonial interest invitations. Accepted connections unlock secure chat rooms.
        </p>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-4 p-1.5 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-xl mb-6">
          <TabsTrigger value="received" className="text-xs font-bold py-2">
            Received ({received.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="text-xs font-bold py-2">
            Sent ({sent.length})
          </TabsTrigger>
          <TabsTrigger value="accepted" className="text-xs font-bold py-2">
            Accepted ({accepted.length})
          </TabsTrigger>
          <TabsTrigger value="declined" className="text-xs font-bold py-2">
            Declined ({declined.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="outline-none">
          {renderCardList(received, 'received')}
        </TabsContent>

        <TabsContent value="sent" className="outline-none">
          {renderCardList(sent, 'sent')}
        </TabsContent>

        <TabsContent value="accepted" className="outline-none">
          {renderCardList(accepted, 'accepted')}
        </TabsContent>

        <TabsContent value="declined" className="outline-none">
          {renderCardList(declined, 'declined')}
        </TabsContent>
      </Tabs>
    </div>
  )
}
