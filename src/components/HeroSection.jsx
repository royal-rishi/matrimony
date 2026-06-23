import React from 'react';
import DownloadButtons from './DownloadButtons';
import useScrollAnimation from '../hooks/useScrollAnimation';

export default function HeroSection() {
  const [sectionRef, isVisible] = useScrollAnimation(0.05);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen pt-32 pb-24 flex items-center justify-center bg-background overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#6366F115_0%,transparent_70%)] pointer-events-none" />
      
      {/* Faint CSS Grid Line Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Blurred circles */}
      <div className="absolute top-20 right-[-10%] w-[400px] h-[400px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-[-10%] w-[300px] h-[300px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-[10%] w-[250px] h-[250px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
        
        {/* Left Content Column */}
        <div 
          className={`lg:col-span-7 flex flex-col items-start text-left transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'
          }`}
        >
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full mb-6">
            <span role="img" aria-label="fire">🔥</span> #1 Habit Tracker for India
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-none mb-6">
            Build Habits That <br />
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
              Actually Stick
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-textSecondary max-w-xl leading-relaxed mb-8">
            Track your habits, build powerful streaks, and transform your daily routine — one day at a time. <span role="img" aria-label="rocket">🚀</span>
          </p>

          {/* Mini Stats Row */}
          <div className="flex flex-wrap items-center gap-y-4 gap-x-8 mb-10 w-full">
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-white">10,000+</span>
              <span className="text-xs text-textSecondary font-medium uppercase tracking-wider">Active Users</span>
            </div>
            <div className="w-[1px] h-8 bg-borderCustom/50 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-white">₹19/month</span>
              <span className="text-xs text-textSecondary font-medium uppercase tracking-wider">India's Lowest</span>
            </div>
            <div className="w-[1px] h-8 bg-borderCustom/50 hidden sm:block" />
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-white">4.8 ⭐</span>
              <span className="text-xs text-textSecondary font-medium uppercase tracking-wider">Avg Rating</span>
            </div>
          </div>

          {/* Download Buttons */}
          <div id="hero-download" className="mb-10 w-full">
            <DownloadButtons size="normal" />
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3 overflow-hidden">
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-primary flex items-center justify-center text-xs font-bold text-white">PS</div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-accent flex items-center justify-center text-xs font-bold text-white">RK</div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-warning flex items-center justify-center text-xs font-bold text-white">AM</div>
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-error flex items-center justify-center text-xs font-bold text-white">VP</div>
            </div>
            <p className="text-sm text-textSecondary font-medium">
              Join <span className="text-white font-bold">10,000+</span> people building better habits
            </p>
          </div>
        </div>

        {/* Right Phone Mockup Column */}
        <div 
          className={`lg:col-span-5 flex justify-center items-center transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[50px]'
          }`}
        >
          {/* CSS Phone Container */}
          <div className="relative animate-[float_4s_ease-in-out_infinite] cursor-pointer">
            {/* Phone Frame */}
            <div className="w-[280px] h-[560px] bg-[#1C1E26] border-8 border-borderCustom rounded-[40px] shadow-[0_0_0_1px_#3A3D52,0_30px_60px_-12px_#00000080,0_0_100px_-20px_rgba(99,102,241,0.3)] overflow-hidden flex flex-col relative">
              
              {/* Phone Status Bar */}
              <div className="h-10 px-6 flex justify-between items-center text-white text-[11px] font-bold z-20">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  {/* Signal bars */}
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3c-1.2 0-2.4.2-3.6.7L12 18l3.6-14.3c-1.2-.5-2.4-.7-3.6-.7z" opacity="0.3" />
                    <path d="M12 3c-1.2 0-2.4.2-3.6.7L12 18l3.6-14.3c-1.2-.5-2.4-.7-3.6-.7z" />
                  </svg>
                  {/* Wifi */}
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21l-12-18h24z" />
                  </svg>
                  {/* Battery */}
                  <div className="w-5 h-2.5 border border-white/80 rounded-[3px] p-[1px] flex items-center">
                    <div className="w-3.5 h-full bg-white rounded-[1px]" />
                  </div>
                </div>
              </div>

              {/* Phone App Content Screen */}
              <div className="flex-1 px-5 pt-2 flex flex-col overflow-y-auto z-10">
                {/* Header Row */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-textSecondary uppercase tracking-wider font-semibold">Welcome Back</span>
                    <h4 className="text-sm font-extrabold text-white">Rishi 👋</h4>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-primaryLight flex items-center justify-center text-xs font-bold text-white shadow-md shadow-primary/20">
                    R
                  </div>
                </div>

                {/* Circular Progress Ring Card */}
                <div className="bg-[#111318]/50 border border-borderCustom/30 p-4 rounded-2xl flex flex-col items-center mb-6 shadow-sm">
                  <span className="text-[11px] font-bold text-textSecondary mb-2">Today's Progress</span>
                  {/* Circular progress container */}
                  <div className="relative w-24 h-24 flex items-center justify-center mb-1">
                    {/* Ring background */}
                    <div 
                      className="absolute inset-0 rounded-full" 
                      style={{
                        background: 'conic-gradient(#6366F1 240deg, #1C1E26 0deg)'
                      }}
                    />
                    {/* Ring mask */}
                    <div className="absolute inset-[8px] rounded-full bg-[#1C1E26] flex flex-col items-center justify-center leading-none">
                      <span className="text-base font-extrabold text-white">4/6</span>
                      <span className="text-[9px] text-textSecondary font-semibold mt-0.5">Habits</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-accent font-bold mt-1">Consistency Score: 84%</span>
                </div>

                {/* Streak Card */}
                <div className="bg-gradient-to-r from-streak to-gold p-3.5 rounded-xl flex items-center justify-between mb-5 shadow-lg shadow-streak/10">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🔥</span>
                    <div className="flex flex-col items-start leading-tight">
                      <span className="text-xs font-extrabold text-white">12 Day Streak</span>
                      <span className="text-[9px] text-white/80 font-medium">Keep going, don't break the chain!</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-white/20 text-white font-bold px-2.5 py-0.5 rounded-full">Pro</span>
                </div>

                {/* Habit Cards */}
                <div className="flex flex-col gap-2.5">
                  <div className="bg-[#111318] border-l-4 border-accent p-3 rounded-r-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-base">🧘</span>
                      <div className="flex flex-col items-start leading-none">
                        <span className="text-xs font-bold text-white">Morning Meditation</span>
                        <span className="text-[9px] text-textSecondary mt-1">07:00 AM · 10 mins</span>
                      </div>
                    </div>
                    <span className="text-xs text-accent">✅ Done</span>
                  </div>

                  <div className="bg-[#111318] border-l-4 border-primary p-3 rounded-r-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-base">🏋️</span>
                      <div className="flex flex-col items-start leading-none">
                        <span className="text-xs font-bold text-white">Evening Gym Routine</span>
                        <span className="text-[9px] text-textSecondary mt-1">06:00 PM · 45 mins</span>
                      </div>
                    </div>
                    <span className="text-xs text-accent">✅ Done</span>
                  </div>

                  <div className="bg-[#111318] border-l-4 border-warning p-3 rounded-r-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-base">📖</span>
                      <div className="flex flex-col items-start leading-none">
                        <span className="text-xs font-bold text-white">Read 10 Pages</span>
                        <span className="text-[9px] text-textSecondary mt-1">09:30 PM · Book</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-textSecondary font-semibold">Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
