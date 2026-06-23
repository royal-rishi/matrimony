'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle, Phone, Mail, MapPin, Shield } from 'lucide-react'

const faqs = [
  {
    q: 'How does Rishta Jodo ensure profile authenticity?',
    a: 'Every registration triggers manual verification by our compliance administrators. We strictly screen standard biological info, documentation, and photo authenticity to keep your search pool entirely secure and spam-free.',
  },
  {
    q: 'Are my photographs and private bio-data fully secure?',
    a: 'Yes! High security and premium user controls are our primary highlights. Your photographs are protected under standard encryption and cannot be shareable with or indexed by external search systems like Google.',
  },
  {
    q: 'Do you facilitate traditional Kundali horoscope alignment?',
    a: 'Yes! We support comprehensive custom criteria setup. Match-seekers can seamlessly coordinate celestial chart matching, Gothra syncing, and multi-state preferences smoothly.',
  },
  {
    q: 'What defines the Dedicate Elite Matchmaker service?',
    a: 'Under our customized Elite lists, we assign a senior relationship officer who helps schedule family calls, verify ancestral backgrounds, exchange proposals securely, and host physical interactions gracefully.',
  },
  {
    q: 'What are your offline registration details?',
    a: 'We are physically situated at Punjabi Colony, Delhi, 110040. Seekers can book offline visits, meet physical matchmakers, and acquire physical portfolios of vetted proposals.',
  },
]

export function FaqSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-20 bg-white dark:bg-zinc-950 border-b border-pink-100/60 dark:border-zinc-900/60">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-pink-655 dark:text-pink-400">
            Curated Clarity
          </span>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#3c0f20] dark:text-white font-serif">
            Have Some Clarifications?
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
            We look forward to serving respected families with extreme diligence, sacred trust, and modern convenience. Explore common responses to our process.
          </p>
        </div>

        {/* Side-by-Side Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* FAQ Accordion List (Left Column) */}
          <div className="lg:col-span-7 space-y-4">
            {faqs.map((faq, idx) => {
              const isExpanded = activeIndex === idx
              const stepNum = String(idx + 1).padStart(2, '0')
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-900/60 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden shadow-sm transition-all duration-300"
                >
                  <button
                    type="button"
                    className="w-full text-left px-5 py-4 flex items-center justify-between font-bold text-zinc-800 dark:text-zinc-200 hover:text-pink-650 dark:hover:text-pink-400 transition-colors"
                    onClick={() => toggleFaq(idx)}
                  >
                    <span className="flex items-center gap-3 text-xs sm:text-sm">
                      <span className="text-[11px] font-black text-pink-600 font-mono tracking-widest">{stepNum}</span>
                      <HelpCircle className="h-4.5 w-4.5 text-zinc-450 shrink-0 hidden sm:inline" />
                      <span>{faq.q}</span>
                    </span>
                    <ChevronDown className={`h-4.5 w-4.5 text-zinc-400 shrink-0 transition-transform duration-300 ${
                      isExpanded ? 'rotate-180 text-pink-650' : ''
                    }`} />
                  </button>
                  
                  {/* Accordion Collapse/Expand Panel */}
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-72 border-t border-zinc-100 dark:border-zinc-850 p-5 bg-pink-50/10 dark:bg-zinc-900/10' : 'max-h-0'
                  }`}>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Support Information Card (Right Column) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#FFF5F8] to-[#FFF0F5] dark:from-zinc-900/80 dark:to-pink-950/20 rounded-2xl border border-pink-100/50 dark:border-zinc-800 p-6 shadow-md space-y-6">
            
            <h4 className="text-sm font-black text-[#3c0f20] dark:text-white uppercase tracking-wider border-b border-pink-200/40 dark:border-zinc-800 pb-3">
              Support Desk Details
            </h4>

            <div className="space-y-5">
              
              {/* Item 1 */}
              <div className="flex gap-4 items-start">
                <div className="h-9 w-9 rounded-full bg-white dark:bg-zinc-950 border border-pink-100 dark:border-zinc-800 flex items-center justify-center text-pink-650 shrink-0 shadow-sm">
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h5 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-200">
                    100% Privacy Fortified
                  </h5>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5 font-semibold">
                    State compliance certified protection
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex gap-4 items-start">
                <div className="h-9 w-9 rounded-full bg-white dark:bg-zinc-950 border border-pink-100 dark:border-zinc-800 flex items-center justify-center text-pink-650 shrink-0 shadow-sm">
                  <MapPin className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h5 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-200">
                    Barauni , Begusarai, Bihar 851115
                  </h5>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5 font-semibold">
                    Reach customized matches physically
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex gap-4 items-start border-t border-pink-200/30 dark:border-zinc-800/80 pt-4">
                <div className="h-9 w-9 rounded-full bg-white dark:bg-zinc-950 border border-pink-100 dark:border-zinc-800 flex items-center justify-center text-pink-650 shrink-0 shadow-sm">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h5 className="font-extrabold text-xs text-zinc-450 dark:text-zinc-450 uppercase tracking-wider leading-none">
                    Support Desk Phone
                  </h5>
                  <a
                    href="tel:+918340465337"
                    className="block font-black text-sm text-[#3c0f20] dark:text-pink-400 hover:underline mt-1"
                  >
                    +91 8340465337
                  </a>
                </div>
              </div>

              {/* Item 4 */}
              <div className="flex gap-4 items-start">
                <div className="h-9 w-9 rounded-full bg-white dark:bg-zinc-950 border border-pink-100 dark:border-zinc-800 flex items-center justify-center text-pink-650 shrink-0 shadow-sm">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h5 className="font-extrabold text-xs text-zinc-455 dark:text-zinc-450 uppercase tracking-wider leading-none">
                    Support Desk Email
                  </h5>
                  <a
                    href="mailto:rishtajodomatrimony@gmail.com"
                    className="block font-black text-xs text-[#3c0f20] dark:text-pink-400 hover:underline mt-1 truncate"
                  >
                    rishtajodomatrimony@gmail.com
                  </a>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
