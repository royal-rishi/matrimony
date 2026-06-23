import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import useScrollAnimation from '../hooks/useScrollAnimation';

export default function FAQSection() {
  const [sectionRef, isVisible] = useScrollAnimation(0.05);
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "Is HabitFlow free to use?",
      a: "Yes! HabitFlow is completely free to download and use. The free plan includes up to 5 habits, streak tracking, badges, and 7-day analytics. Upgrade to Pro for just ₹19/month to unlock unlimited habits and advanced features."
    },
    {
      q: "What is included in the Pro plan?",
      a: "HabitFlow Pro (₹19/month or ₹199/year) includes: unlimited habits, 30/90/365 day analytics, 365-day activity heatmap, personal AI insights, measurable habit tracking, custom reminders, data export, and no ads."
    },
    {
      q: "How do I cancel my subscription?",
      a: "You can cancel anytime directly from within the app. Go to Profile → Subscription → Cancel Subscription. Your Pro access continues until the end of the billing period."
    },
    {
      q: "Is my data safe?",
      a: "Absolutely. Your data is stored securely on Supabase (enterprise-grade PostgreSQL). We never sell your data. You can export or delete your data anytime."
    },
    {
      q: "Does it work offline?",
      a: "Yes! HabitFlow caches your habits locally. You can view and check in habits offline. Data syncs automatically when you reconnect to the internet."
    },
    {
      q: "Is HabitFlow available on iOS?",
      a: "HabitFlow is currently available on Android (Google Play). iOS version is coming soon! Join our waitlist in the footer to get notified when it launches."
    },
    {
      q: "What are streak freezes?",
      a: "Streak freezes protect your habit streak when you miss a day. You get 2 free streak freezes per month. You can earn additional freezes by watching a short ad."
    },
    {
      q: "Can I track measurable habits like water intake?",
      a: "Yes! With Pro, you can create measurable habits and track quantities — like 8 glasses of water, 30 pages read, or 5 km walked. Use a slider to log your progress."
    },
    {
      q: "What are Challenges?",
      a: "Challenges are time-bound habit goals (7-day, 21-day, 30-day) that you can join. Compete with thousands of users on the leaderboard and earn bonus XP on completion."
    },
    {
      q: "How do I contact support?",
      a: "Email us at support@habitflow.app or use the in-app feedback form (Profile → Settings → Send Feedback). We respond within 24 hours."
    }
  ];

  const handleToggle = (idx) => {
    if (openIndex === idx) {
      setOpenIndex(null);
    } else {
      setOpenIndex(idx);
    }
  };

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="py-24 bg-background relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-1/2 right-[-10%] w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'
          }`}
        >
          <span className="text-xs uppercase font-extrabold tracking-[2px] text-primary">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        {/* FAQ Accordion List */}
        <div className="flex flex-col gap-3.5 max-w-3xl mx-auto">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`border rounded-xl transition-all duration-300 ${
                  isOpen 
                    ? 'bg-card border-primary/30' 
                    : 'bg-[#1C1E26]/40 border-borderCustom/40 hover:bg-[#1C1E26]/80 hover:border-borderCustom/80'
                } transition-all duration-1000 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'
                }`}
                style={{
                  transitionDelay: isVisible ? `${idx * 40}ms` : '0ms'
                }}
              >
                {/* FAQ Header Button */}
                <button
                  onClick={() => handleToggle(idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-white text-sm sm:text-base cursor-pointer focus:outline-none select-none"
                >
                  <span className={isOpen ? 'text-primary' : 'text-textPrimary'}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-primary flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'transform rotate-180' : 'transform rotate-0'
                    }`}
                  />
                </button>

                {/* Collapsible Answer container */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out`}
                  style={{
                    maxHeight: isOpen ? '200px' : '0px'
                  }}
                >
                  <div className="px-5 pb-5 text-xs sm:text-sm text-textSecondary leading-relaxed border-t border-borderCustom/20 pt-4">
                    {faq.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
