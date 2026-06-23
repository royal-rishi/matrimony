import React from 'react';
import { Heart } from 'lucide-react';
import DownloadButtons from './DownloadButtons';

export default function Footer() {
  const handleScrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#070810] border-t border-borderCustom/60 pt-16 pb-8 relative overflow-hidden">
      
      {/* Footer grid */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 relative z-10 text-left">
        
        {/* Column 1 - Brand Details */}
        <div className="lg:col-span-4 flex flex-col items-start gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-tr from-primary to-accent rounded-lg">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex items-center text-xl font-extrabold tracking-tight">
              <span className="text-white">Habit</span>
              <span className="text-primary ml-[2px]">Flow</span>
            </div>
          </div>
          <p className="text-sm text-textSecondary font-medium leading-relaxed max-w-[280px]">
            Build Better. One Day at a Time. Build streaks, track habits, and unlock your potential.
          </p>
          
          {/* Social icons row */}
          <div className="flex items-center gap-3 mt-2">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-card hover:bg-primary/20 flex items-center justify-center text-textSecondary hover:text-white transition-all duration-200 cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-card hover:bg-primary/20 flex items-center justify-center text-textSecondary hover:text-white transition-all duration-200 cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-card hover:bg-primary/20 flex items-center justify-center text-textSecondary hover:text-white transition-all duration-200 cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-card hover:bg-primary/20 flex items-center justify-center text-textSecondary hover:text-white transition-all duration-200 cursor-pointer">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
              </svg>
            </a>
          </div>

          <span className="text-[11px] text-textDisabled font-medium uppercase tracking-wider flex items-center gap-1.5 mt-4">
            Made with <Heart className="w-3.5 h-3.5 text-error fill-error" /> in India 🇮🇳
          </span>
        </div>

        {/* Column 2 - Product */}
        <div className="lg:col-span-2 flex flex-col items-start gap-4">
          <span className="text-[10px] font-extrabold uppercase text-textDisabled tracking-widest leading-none mb-1">
            Product
          </span>
          <button onClick={() => handleScrollToSection('features')} className="text-sm text-textSecondary hover:text-white transition-colors duration-200 cursor-pointer text-left">
            Features
          </button>
          <button onClick={() => handleScrollToSection('pricing')} className="text-sm text-textSecondary hover:text-white transition-colors duration-200 cursor-pointer text-left">
            Pricing
          </button>
          <button onClick={() => handleScrollToSection('how-it-works')} className="text-sm text-textSecondary hover:text-white transition-colors duration-200 cursor-pointer text-left">
            Challenges
          </button>
          <a href="#whats-new" className="text-sm text-textSecondary hover:text-white transition-colors duration-200 text-left">
            What's New
          </a>
        </div>

        {/* Column 3 - Support */}
        <div className="lg:col-span-2 flex flex-col items-start gap-4">
          <span className="text-[10px] font-extrabold uppercase text-textDisabled tracking-widest leading-none mb-1">
            Support
          </span>
          <button onClick={() => handleScrollToSection('faq')} className="text-sm text-textSecondary hover:text-white transition-colors duration-200 cursor-pointer text-left">
            FAQs
          </button>
          <a href="mailto:support@habitflow.app" className="text-sm text-textSecondary hover:text-white transition-colors duration-200 text-left">
            Contact Us
          </a>
          <a href="#privacy" className="text-sm text-textSecondary hover:text-white transition-colors duration-200 text-left">
            Privacy Policy
          </a>
          <a href="#terms" className="text-sm text-textSecondary hover:text-white transition-colors duration-200 text-left">
            Terms of Service
          </a>
          <a href="#refund" className="text-sm text-textSecondary hover:text-white transition-colors duration-200 text-left">
            Refund Policy
          </a>
        </div>

        {/* Column 4 - Compact Download */}
        <div className="lg:col-span-4 flex flex-col items-start gap-4 w-full">
          <span className="text-[10px] font-extrabold uppercase text-textDisabled tracking-widest leading-none mb-1">
            Download App
          </span>
          <div className="w-full max-w-[280px]">
            <DownloadButtons size="compact" />
          </div>
          {/* iOS Coming Soon badge */}
          <div className="w-full max-w-[245px] bg-[#1C1E26]/50 border border-borderCustom/40 rounded-lg py-2 text-center text-[11px] font-bold text-textSecondary select-none">
            iOS Waitlist Available 🍎
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-6 border-t border-borderCustom/30 pt-8 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-[11px] sm:text-xs text-textDisabled font-medium text-center">
          © 2025 HabitFlow. All rights reserved.
        </span>
        <div className="flex items-center gap-6 text-[11px] sm:text-xs text-textDisabled font-medium">
          <a href="#privacy" className="hover:text-white transition-colors duration-200">Privacy Policy</a>
          <span>·</span>
          <a href="#terms" className="hover:text-white transition-colors duration-200">Terms</a>
          <span>·</span>
          <a href="#refund" className="hover:text-white transition-colors duration-200">Refund Policy</a>
        </div>
      </div>
    </footer>
  );
}
