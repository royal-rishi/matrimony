import React from 'react';
import useScrollAnimation from '../hooks/useScrollAnimation';

export default function ScreenshotsSection() {
  const [sectionRef, isVisible] = useScrollAnimation(0.05);

  const mockScreens = [
    {
      id: 1,
      name: 'Home Screen',
      rotation: 'lg:rotate-[-4deg]',
      accentColor: 'shadow-accent/10 hover:shadow-accent/25',
      content: (
        <div className="flex flex-col h-full bg-[#1C1E26] px-4 pt-1">
          <div className="flex justify-between items-center mb-4 text-left">
            <div>
              <span className="text-[8px] text-textSecondary uppercase font-bold">Today</span>
              <h5 className="text-[11px] font-extrabold text-white">Good Morning 👋</h5>
            </div>
            <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[8px] text-accent font-bold">85%</div>
          </div>
          {/* Conic Progress Circle */}
          <div className="my-3 flex justify-center">
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-background border border-borderCustom/40 shadow-inner">
              <div 
                className="absolute inset-0 rounded-full" 
                style={{
                  background: 'conic-gradient(#10B981 310deg, #111318 0deg)'
                }}
              />
              <div className="absolute inset-[6px] rounded-full bg-[#1C1E26] flex flex-col items-center justify-center leading-none">
                <span className="text-sm font-extrabold text-white">5/6</span>
                <span className="text-[8px] text-textSecondary font-semibold mt-0.5">Completions</span>
              </div>
            </div>
          </div>
          {/* Habit Items */}
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="bg-[#111318] p-2 rounded-lg flex items-center justify-between text-left">
              <span className="text-[9px] font-bold text-white">💧 Hydrate (2L)</span>
              <span className="text-[8px] text-accent font-semibold">Done</span>
            </div>
            <div className="bg-[#111318] p-2 rounded-lg flex items-center justify-between text-left">
              <span className="text-[9px] font-bold text-white">🧘 Yoga Session</span>
              <span className="text-[8px] text-accent font-semibold">Done</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      name: 'Habits Tracker',
      rotation: 'lg:rotate-[-2deg]',
      accentColor: 'shadow-primary/10 hover:shadow-primary/25',
      content: (
        <div className="flex flex-col h-full bg-[#1C1E26] px-4 pt-1">
          <span className="text-[8px] text-textSecondary uppercase font-bold text-left mb-1.5">My Habits</span>
          {/* Search bar */}
          <div className="bg-[#111318] text-[8px] text-textSecondary border border-borderCustom/30 px-3 py-1 rounded-lg text-left mb-3 flex items-center gap-1.5">
            <span>🔍</span> Search your habits...
          </div>
          {/* Habit Items */}
          <div className="flex flex-col gap-1.5">
            <div className="bg-[#111318] p-2 rounded-lg flex items-center gap-2 text-left border-l-2 border-primary">
              <span className="p-1 rounded bg-primary/10 text-[10px]">🍎</span>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-white">Eat Healthy Meal</span>
                <span className="text-[7px] text-textSecondary">Daily · Afternoon</span>
              </div>
            </div>
            <div className="bg-[#111318] p-2 rounded-lg flex items-center gap-2 text-left border-l-2 border-accent">
              <span className="p-1 rounded bg-accent/10 text-[10px]">🏃</span>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-white">Evening Jog</span>
                <span className="text-[7px] text-textSecondary">Mon, Wed, Fri</span>
              </div>
            </div>
            <div className="bg-[#111318] p-2 rounded-lg flex items-center gap-2 text-left border-l-2 border-warning">
              <span className="p-1 rounded bg-warning/10 text-[10px]">💻</span>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-white">Coding Practice</span>
                <span className="text-[7px] text-textSecondary">Daily · 1 hour</span>
              </div>
            </div>
          </div>
          {/* FAB */}
          <div className="absolute bottom-4 right-4 w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-primary/30 pointer-events-none">+</div>
        </div>
      )
    },
    {
      id: 3,
      name: 'Deep Analytics',
      rotation: 'lg:rotate-[0deg] lg:scale-105 z-20',
      accentColor: 'shadow-primary/20 hover:shadow-primary/40',
      isCenter: true,
      content: (
        <div className="flex flex-col h-full bg-[#1C1E26] px-4 pt-1">
          <div className="flex justify-between items-center mb-3 text-left">
            <div>
              <span className="text-[8px] text-textSecondary uppercase font-bold">Insight</span>
              <h5 className="text-[11px] font-extrabold text-white">Performance Overview</h5>
            </div>
            <span className="text-[8px] text-primary font-bold">This Week</span>
          </div>
          {/* Detailed Score */}
          <div className="bg-[#111318] p-2.5 rounded-xl flex items-center justify-between mb-3 border border-borderCustom/20 text-left">
            <div className="flex flex-col">
              <span className="text-[14px] font-extrabold text-white">92%</span>
              <span className="text-[7px] text-textSecondary">Completion Rate</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold">💪</div>
          </div>
          {/* Bar Chart Mockup */}
          <span className="text-[8px] text-textSecondary text-left mb-1.5 font-bold">Weekly Trend</span>
          <div className="bg-[#111318] p-2.5 rounded-xl flex items-end justify-between h-20 mb-3 border border-borderCustom/20">
            <div className="w-3.5 h-12 bg-primary/40 rounded-t-sm" />
            <div className="w-3.5 h-16 bg-primary/60 rounded-t-sm" />
            <div className="w-3.5 h-10 bg-primary/40 rounded-t-sm" />
            <div className="w-3.5 h-14 bg-primary/50 rounded-t-sm" />
            <div className="w-3.5 h-18 bg-primary/80 rounded-t-sm" />
            <div className="w-3.5 h-8 bg-primary/30 rounded-t-sm" />
            <div className="w-3.5 h-[76px] bg-gradient-to-t from-primary to-primaryLight rounded-t-sm" />
          </div>
          {/* Day Label Footer */}
          <div className="flex justify-between text-[7px] text-textSecondary font-bold px-1.5">
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
          </div>
        </div>
      )
    },
    {
      id: 4,
      name: 'Smart Challenges',
      rotation: 'lg:rotate-[2deg]',
      accentColor: 'shadow-gold/10 hover:shadow-gold/25',
      content: (
        <div className="flex flex-col h-full bg-[#1C1E26] px-4 pt-1">
          <span className="text-[8px] text-textSecondary uppercase font-bold text-left mb-1.5">Challenges</span>
          {/* Active Challenge Card */}
          <div className="bg-gradient-to-r from-primary to-accent p-2.5 rounded-xl flex flex-col items-start text-left mb-3 shadow-md">
            <span className="text-[7px] bg-white/20 text-white font-bold px-1.5 py-0.5 rounded-full mb-1">Active</span>
            <span className="text-[9px] font-extrabold text-white leading-tight">21-Day Mindfulness Quest</span>
            <span className="text-[7px] text-white/80 mt-1">210 Participants · Day 9</span>
          </div>
          {/* Leaderboard */}
          <span className="text-[8px] text-textSecondary text-left mb-1.5 font-bold">Leaderboard Ranking</span>
          <div className="flex flex-col gap-1">
            <div className="bg-[#111318] p-1.5 rounded-lg flex items-center justify-between text-left border border-borderCustom/20">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] text-gold font-bold">🥇</span>
                <span className="text-[8px] font-bold text-white">Amit S.</span>
              </div>
              <span className="text-[8px] text-textSecondary">450 XP</span>
            </div>
            <div className="bg-[#111318] p-1.5 rounded-lg flex items-center justify-between text-left border border-borderCustom/20">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] text-textSecondary font-bold">🥈</span>
                <span className="text-[8px] font-bold text-white">Pooja G.</span>
              </div>
              <span className="text-[8px] text-textSecondary">420 XP</span>
            </div>
            <div className="bg-[#111318] p-1.5 rounded-lg flex items-center justify-between text-left border border-borderCustom/20">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] text-streak font-bold">🥉</span>
                <span className="text-[8px] font-bold text-white">Rishi K. (You)</span>
              </div>
              <span className="text-[8px] text-accent font-bold">390 XP</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      name: 'Earn Rewards',
      rotation: 'lg:rotate-[4deg]',
      accentColor: 'shadow-warning/10 hover:shadow-warning/25',
      content: (
        <div className="flex flex-col h-full bg-[#1C1E26] px-4 pt-1">
          <span className="text-[8px] text-textSecondary uppercase font-bold text-left mb-1.5">Rewards</span>
          {/* Level Badge Circle */}
          <div className="flex flex-col items-center my-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-warning to-gold flex items-center justify-center text-white text-base font-extrabold shadow-lg shadow-warning/20 border-4 border-background leading-none">
              Lvl 9
            </div>
            <span className="text-[9px] font-extrabold text-white mt-1.5">Zen Master Title</span>
          </div>
          {/* XP Progress Bar */}
          <div className="w-full bg-[#111318] h-2 rounded-full overflow-hidden mb-4 border border-borderCustom/30">
            <div className="bg-gradient-to-r from-warning to-gold h-full w-[75%]" />
          </div>
          {/* Badges unlocked */}
          <span className="text-[8px] text-textSecondary text-left mb-1.5 font-bold">My Badges</span>
          <div className="grid grid-cols-3 gap-1.5 justify-items-center">
            <div className="w-10 h-10 rounded-lg bg-[#111318] flex items-center justify-center text-lg border border-borderCustom/20 shadow-sm" title="7-Day Streak">🔥</div>
            <div className="w-10 h-10 rounded-lg bg-[#111318] flex items-center justify-center text-lg border border-borderCustom/20 shadow-sm" title="Morning Warrior">🌅</div>
            <div className="w-10 h-10 rounded-lg bg-[#111318] flex items-center justify-center text-lg border border-borderCustom/20 shadow-sm" title="No Breaks">🏆</div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section
      ref={sectionRef}
      className="py-24 bg-[#0F1117] border-y border-borderCustom/30 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 text-center">
        {/* Section Header */}
        <div
          className={`transition-all duration-1000 mb-16 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'
          }`}
        >
          <span className="text-xs uppercase font-extrabold tracking-[2px] text-primary">
            APP PREVIEW
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">
            Everything you need to build{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              better habits
            </span>
          </h2>
        </div>

        {/* Scrolling Cards Row */}
        <div
          className={`flex gap-6 overflow-x-auto pb-8 pt-4 px-4 justify-start lg:justify-center scrollbar-none items-end transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'
          }`}
        >
          {mockScreens.map((screen) => (
            <div
              key={screen.id}
              className={`flex-none flex flex-col items-center gap-4 transition-all duration-300 hover:rotate-0 hover:scale-105 ${screen.rotation}`}
            >
              {/* Phone Mockup Wrapper */}
              <div 
                className={`w-[200px] h-[400px] bg-[#1C1E26] border-[6px] border-borderCustom rounded-[30px] flex flex-col relative overflow-hidden shadow-2xl transition-shadow duration-300 ${screen.accentColor}`}
              >
                {/* Status Bar */}
                <div className="h-7 px-4 flex justify-between items-center text-white text-[8px] font-bold z-20">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-1.5 border border-white/50 rounded-[2px] p-[0.5px] flex items-center">
                      <div className="w-2 h-full bg-white rounded-[0.5px]" />
                    </div>
                  </div>
                </div>

                {/* App screen mockup content */}
                <div className="flex-1 overflow-hidden relative pb-4 flex flex-col">
                  {screen.content}
                </div>
              </div>

              {/* Label */}
              <span className="text-xs font-bold text-textSecondary uppercase tracking-wider">
                {screen.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
