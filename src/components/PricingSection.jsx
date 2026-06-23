import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import useScrollAnimation from '../hooks/useScrollAnimation';

export default function PricingSection() {
  const [sectionRef, isVisible] = useScrollAnimation(0.05);
  const [isYearly, setIsYearly] = useState(true);

  const scrollToHeroDownload = () => {
    const element = document.getElementById('hero-download');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const freeFeatures = [
    { text: 'Up to 5 active habits', included: true },
    { text: 'Daily check-ins', included: true },
    { text: 'Streak tracking & reminders', included: true },
    { text: 'Badges & XP levels', included: true },
    { text: '7-day analytics charts', included: true },
    { text: 'Join basic challenges', included: true },
    { text: 'Unlimited habits', included: false },
    { text: 'Advanced 30/90/365d analytics', included: false },
    { text: 'Custom reminders per habit', included: false },
    { text: 'Data export (CSV)', included: false },
    { text: 'Ad-free experience', included: false },
  ];

  const proFeatures = [
    { text: 'Unlimited active habits', included: true },
    { text: 'Advanced analytics & trends', included: true },
    { text: '365-day activity heatmap', included: true },
    { text: 'Personal AI habit insights', included: true },
    { text: 'Custom reminders per habit', included: true },
    { text: 'Measurable quantity-based goals', included: true },
    { text: 'Data export (CSV format)', included: true },
    { text: '100% Ad-free experience', included: true },
    { text: 'Priority customer support', included: true },
    { text: 'All upcoming Pro features', included: true },
  ];

  return (
    <section
      id="pricing"
      ref={sectionRef}
      className="py-24 bg-background relative overflow-hidden"
    >
      {/* Background radial glow */}
      <div className="absolute top-10 left-[10%] w-[350px] h-[350px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-[10%] w-[350px] h-[350px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        
        {/* Section Header */}
        <div
          className={`max-w-2xl mx-auto mb-12 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'
          }`}
        >
          <span className="text-xs uppercase font-extrabold tracking-[2px] text-primary">
            PRICING
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">
            Simple, Affordable Pricing
          </h2>
          <p className="text-textSecondary text-base sm:text-lg mt-3 italic leading-relaxed">
            Less than a samosa <span role="img" aria-label="samosa">🥟</span> per month
          </p>
        </div>

        {/* Pricing Toggle */}
        <div
          className={`flex items-center justify-center gap-4 mb-16 transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'
          }`}
        >
          <span className={`text-sm font-bold transition-colors duration-200 ${!isYearly ? 'text-white' : 'text-textSecondary'}`}>
            Monthly
          </span>
          
          {/* Toggle Button */}
          <button
            onClick={() => setIsYearly(!isYearly)}
            className="w-12 h-6 bg-card border border-borderCustom rounded-full p-[2px] relative cursor-pointer"
          >
            <div
              className={`w-5 h-5 bg-primary rounded-full transition-transform duration-300 transform ${
                isYearly ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>

          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold transition-colors duration-200 ${isYearly ? 'text-white' : 'text-textSecondary'}`}>
              Yearly
            </span>
            <span className="text-[10px] bg-accent/10 border border-accent/20 text-accent font-extrabold px-2 py-0.5 rounded-full">
              Save ₹29
            </span>
          </div>
        </div>

        {/* Pricing Cards Container */}
        <div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-8 max-w-5xl mx-auto mb-8">
          
          {/* Card 1 - Free Plan */}
          <div
            className={`w-full max-w-[340px] bg-card border border-borderCustom/50 rounded-3xl p-8 flex flex-col justify-between text-left transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'
            }`}
          >
            <div>
              <span className="text-xs font-bold text-textSecondary uppercase tracking-wider">Free</span>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-4xl sm:text-5xl font-extrabold text-white">₹0</span>
                <span className="text-sm font-medium text-textSecondary">/forever</span>
              </div>
              <p className="text-xs text-textSecondary font-medium mt-2">Get started and build basic routines</p>
              
              <div className="h-[1px] bg-borderCustom/40 my-6" />

              {/* Feature List */}
              <ul className="space-y-4">
                {freeFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-xs sm:text-sm font-medium">
                    {feat.included ? (
                      <Check className="w-4.5 h-4.5 text-accent flex-shrink-0" />
                    ) : (
                      <X className="w-4.5 h-4.5 text-textDisabled flex-shrink-0" />
                    )}
                    <span className={feat.included ? 'text-textPrimary' : 'text-textDisabled'}>
                      {feat.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={scrollToHeroDownload}
              className="mt-8 w-full border border-primary text-primary hover:bg-primary/5 active:scale-95 transition-all duration-200 h-12 rounded-xl text-sm font-bold flex items-center justify-center cursor-pointer"
            >
              Download Free
            </button>
          </div>

          {/* Card 2 - Pro Plan */}
          <div
            className={`w-full max-w-[370px] bg-gradient-to-b from-[#1C1E26] to-[#24263A] border-2 border-primary rounded-3xl p-8 flex flex-col justify-between text-left relative shadow-[0_0_50px_-15px_rgba(99,102,241,0.4)] transition-all duration-1000 lg:scale-[1.03] delay-400 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'
            }`}
          >
            {/* Most Popular Tag */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primaryLight text-white text-[10px] font-extrabold px-4 py-1 rounded-b-lg tracking-wider uppercase">
              Most Popular
            </div>

            <div className="mt-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Pro</span>
              <div className="flex flex-col mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white">
                    {isYearly ? '₹199' : '₹19'}
                  </span>
                  <span className="text-sm font-medium text-textSecondary">
                    {isYearly ? '/year' : '/month'}
                  </span>
                </div>
                {isYearly && (
                  <span className="text-xs font-extrabold text-accent mt-2.5">
                    ₹16.6/month · Save ₹29 compared to monthly
                  </span>
                )}
              </div>
              <p className="text-xs text-textSecondary font-medium mt-2">
                Billed {isYearly ? 'annually' : 'monthly'}
              </p>

              <div className="h-[1px] bg-borderCustom/40 my-6" />

              {/* Feature List */}
              <ul className="space-y-4">
                {proFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-xs sm:text-sm font-medium text-textPrimary">
                    <Check className="w-4.5 h-4.5 text-accent flex-shrink-0" />
                    <span>{feat.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <a
                href="android-app://com.habitflow.app/paywall"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToHeroDownload();
                }}
                className="w-full bg-gradient-to-r from-primary to-primaryLight hover:brightness-110 active:scale-95 transition-all duration-200 h-12 rounded-xl text-sm font-bold flex items-center justify-center text-white cursor-pointer shadow-lg shadow-primary/20"
              >
                Get Pro Now
              </a>
              <span className="block text-[10px] text-textSecondary text-center mt-2.5">
                * Subscribe inside the app after downloading
              </span>
            </div>
          </div>

        </div>

        {/* Pricing footer */}
        <p className="text-xs text-textDisabled max-w-lg mx-auto leading-relaxed mt-10">
          Cancel your subscription anytime · Payments securely processed via Razorpay · India's most affordable and highly rated habit tracking application
        </p>

      </div>
    </section>
  );
}
