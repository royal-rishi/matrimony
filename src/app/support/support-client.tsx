'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { 
  HelpCircle, 
  MessageSquare, 
  AlertTriangle, 
  Phone, 
  Mail, 
  ChevronDown, 
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createSupportTicketAction, reportUserAction } from '@/features/profiles/actions/support-actions'

interface SupportClientProps {
  isAuthenticated: boolean
  defaultName: string
  defaultEmail: string
}

// Matrimonial FAQs data
const FAQS = [
  {
    question: "Is my personal matrimonial data safe on RishtaJodo?",
    answer: "Yes, 100%. RishtaJodo is built with strict privacy controls. You can restrict your photos, hide your income, and show only the first character of your last name to other users. We never sell your personal information or show it to search engine crawlers."
  },
  {
    question: "How does the profile verification (KYC) badge work?",
    answer: "To get the verified badge, go to your dashboard and upload an government-approved ID proof (e.g. Aadhaar or PAN) and education details. Our expert moderation team manually inspects every document within 24 hours to ensure zero fake profiles."
  },
  {
    question: "What should I do if I find a suspicious or fake profile?",
    answer: "Your safety is our top priority. If you encounter any user asking for financial favors, using inappropriate language, or displaying fake photos, please use the 'Report Abuse' tab on this page or click the flag icon on their profile card immediately."
  },
  {
    question: "How do I upgrade to a Premium plan to unlock chat features?",
    answer: "Go to the Membership Center page. Choose between Gold, Platinum, or Elite plans, and complete the simulated Razorpay checkout. Upgrading immediately unlocks direct messaging, video calls, and matches contact details."
  },
  {
    question: "Can I temporarily hide my profile from matchmaking feeds?",
    answer: "Yes. If you need a break, go to Settings → Security Actions, and click 'Temporarily Deactivate Account'. This will hide your profile from search feeds. You can resume and unhide your profile simply by logging back in."
  }
]

export function SupportClient({ isAuthenticated, defaultName, defaultEmail }: SupportClientProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  // Ticket Form States
  const [ticketLoading, setTicketLoading] = useState(false)
  const [ticketName, setTicketName] = useState(defaultName)
  const [ticketEmail, setTicketEmail] = useState(defaultEmail)
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketMessage, setTicketMessage] = useState('')

  // Report Form States
  const [reportLoading, setReportLoading] = useState(false)
  const [reportedId, setReportedId] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')

  // Toggle FAQ Accordion
  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  // Handle Ticket Submit
  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketName || !ticketEmail || !ticketSubject || !ticketMessage) {
      toast.error('Please fill in all ticket details.')
      return
    }

    setTicketLoading(true)
    try {
      const res = await createSupportTicketAction({
        name: ticketName,
        email: ticketEmail,
        subject: ticketSubject,
        message: ticketMessage
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Your support ticket has been submitted! We will email you shortly.')
        setTicketSubject('')
        setTicketMessage('')
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setTicketLoading(false)
    }
  }

  // Handle Abuse Report Submit
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportedId || !reportReason) {
      toast.error('Please specify the profile to report and select a reason.')
      return
    }

    setReportLoading(true)
    try {
      const res = await reportUserAction({
        reportedId,
        reason: reportReason,
        description: reportDescription
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Report submitted successfully. Our safety team will review it within 12 hours.')
        setReportedId('')
        setReportReason('')
        setReportDescription('')
      }
    } catch {
      toast.error('An unexpected error occurred.')
    } finally {
      setReportLoading(false)
    }
  }

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      {/* Title block */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent dark:from-pink-400 dark:to-rose-400">
          Help & Support Center
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Find answers, contact our relationship managers, or submit inquiries to our support desk.
        </p>
      </div>

      {/* Grid: FAQ & Quick Contact Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FAQs Accordion */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-pink-100/50 dark:border-zinc-800/50 shadow-xl shadow-pink-150/5">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                <HelpCircle className="h-5 w-5 text-pink-500" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Quick solutions to common queries about profiles, membership, and security.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {FAQS.map((faq, index) => {
                const isOpen = openFaqIndex === index
                return (
                  <div 
                    key={index} 
                    className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden transition-all duration-200"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full px-5 py-4 text-left font-semibold text-sm flex items-center justify-between text-zinc-800 dark:text-zinc-200 hover:bg-pink-50/20 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown 
                        className={`h-4 w-4 text-zinc-400 transition-transform duration-200 shrink-0 ${
                          isOpen ? 'transform rotate-180 text-pink-500' : ''
                        }`} 
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-sm text-zinc-500 dark:text-zinc-400 border-t border-zinc-50 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/10 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Quick Contact Options */}
        <div className="space-y-6">
          <Card className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-pink-100/50 dark:border-zinc-800/50 shadow-xl shadow-pink-150/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-100/30 dark:bg-pink-900/10 rounded-full blur-2xl pointer-events-none" />
            <CardHeader>
              <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white">
                Relationship Desk
              </CardTitle>
              <CardDescription>
                Need human assistance? Reach out directly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              {/* Call support */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-pink-50 dark:bg-zinc-900 rounded-lg text-pink-650 shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-250">Call Helpline</h4>
                  <p className="text-zinc-500 text-xs mt-0.5">+91 8340465337</p>
                  <p className="text-zinc-400 text-[10px] mt-0.5">Mon-Sat, 9 AM - 6 PM</p>
                </div>
              </div>

              {/* Email Support */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-pink-50 dark:bg-zinc-900 rounded-lg text-pink-650 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-250">Email Support</h4>
                  <p className="text-zinc-500 text-xs mt-0.5">rishtajodomatrimony@gmail.com</p>
                  <p className="text-zinc-400 text-[10px] mt-0.5">Response within 24 hours</p>
                </div>
              </div>

              {/* WhatsApp Support Button */}
              <div className="pt-3">
                <a 
                  href="https://wa.me/918340465337?text=Hello%20RishtaJodo%20Support%2C%20I%20need%20help%20with%20my%20profile." 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba56] text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.458L0 24zm6.292-3.707l.36.214c1.61.955 3.509 1.46 5.4 1.461 5.922 0 10.738-4.811 10.741-10.735.002-2.87-1.102-5.568-3.11-7.579C17.674 1.644 14.978.541 12.112.541 6.183.541 1.368 5.352 1.364 11.28c-.001 1.952.504 3.86 1.465 5.5l.235.4L1.92 22.147l4.429-1.854z"/>
                  </svg>
                  Connect via WhatsApp Desk
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs Section: Submit Ticket vs Report Abuse */}
      <Tabs defaultValue="ticket" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-zinc-100 p-1 rounded-xl dark:bg-zinc-900 border dark:border-zinc-800">
          <TabsTrigger value="ticket" className="rounded-lg text-sm font-semibold flex items-center justify-center gap-2 py-2">
            <MessageSquare className="h-4 w-4" />
            Submit Inquiry Ticket
          </TabsTrigger>
          <TabsTrigger value="report" className="rounded-lg text-sm font-semibold flex items-center justify-center gap-2 py-2">
            <AlertTriangle className="h-4 w-4" />
            Report Abuse / Flag
          </TabsTrigger>
        </TabsList>

        {/* SUBMIT TICKET TAB */}
        <TabsContent value="ticket" className="mt-6">
          <Card className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-pink-100/50 dark:border-zinc-800/50 shadow-xl shadow-pink-150/5">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                <MessageSquare className="h-5 w-5 text-pink-500" />
                Open a Support Ticket
              </CardTitle>
              <CardDescription>
                Ask a billing query, report a bug, or request manual assistance for your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="t-name">Your Full Name</Label>
                    <Input 
                      id="t-name"
                      value={ticketName}
                      onChange={(e) => setTicketName(e.target.value)}
                      required
                      placeholder="e.g. Rahul Sharma"
                      className="rounded-lg border-zinc-200 dark:border-zinc-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="t-email">Email Address</Label>
                    <Input 
                      id="t-email"
                      type="email"
                      value={ticketEmail}
                      onChange={(e) => setTicketEmail(e.target.value)}
                      required
                      placeholder="e.g. rahul@example.com"
                      className="rounded-lg border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="t-subject">Subject</Label>
                  <Input 
                    id="t-subject"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    required
                    placeholder="e.g. Question about verification documents"
                    className="rounded-lg border-zinc-200 dark:border-zinc-800"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="t-msg">Detail Message</Label>
                  <Textarea
                    id="t-msg"
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    required
                    placeholder="Explain your issue or question in detail..."
                    rows={5}
                    className="rounded-lg border-zinc-200 dark:border-zinc-800 resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={ticketLoading}
                    className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold flex items-center gap-2 rounded-lg h-11 px-6 shadow-md transition-all active:scale-[0.98]"
                  >
                    {ticketLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                    Submit Support Ticket
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORT ABUSE TAB */}
        <TabsContent value="report" className="mt-6">
          <Card className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-red-100/50 dark:border-red-950/30 shadow-xl shadow-red-100/5">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Report Suspicious Behavior / Fake Profile
              </CardTitle>
              <CardDescription>
                Flag users who are violating safety terms, asking for money, or using fake details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isAuthenticated ? (
                <div className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                  <p className="text-sm font-semibold">
                    You must be logged in to report matrimonial profiles for security validation.
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/login'}
                    className="mt-4 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg"
                  >
                    Sign In to Account
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="r-id">Profile ID / First Name of Suspicious User</Label>
                      <Input 
                        id="r-id"
                        value={reportedId}
                        onChange={(e) => setReportedId(e.target.value)}
                        required
                        placeholder="Paste profile UUID or name"
                        className="rounded-lg border-zinc-200 dark:border-zinc-800"
                      />
                      <p className="text-[10px] text-zinc-400">
                        Matches profile table keys for exact mapping.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="r-reason">Primary Reason for Flagging</Label>
                      <Select value={reportReason} onValueChange={(val: string | null) => setReportReason(val || '')}>
                        <SelectTrigger className="w-full rounded-lg border-zinc-200 dark:border-zinc-800">
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fake_profile">Fake Profile / Fake Photos</SelectItem>
                          <SelectItem value="harassment">Harassment / Abusive Messages</SelectItem>
                          <SelectItem value="financial_scam">Asking for Money / Financial Scam</SelectItem>
                          <SelectItem value="false_data">Misleading Information / Already Married</SelectItem>
                          <SelectItem value="spam">Spam / Business Solicitation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="r-desc">Additional Details / Evidence (Optional)</Label>
                    <Textarea
                      id="r-desc"
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Please supply chat statements, date of event, or what suspicious activity occurred..."
                      rows={4}
                      className="rounded-lg border-zinc-200 dark:border-zinc-800 resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={reportLoading}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2 rounded-lg h-11 px-6 shadow-md transition-all active:scale-[0.98]"
                    >
                      {reportLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      Submit Abuse Report
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
