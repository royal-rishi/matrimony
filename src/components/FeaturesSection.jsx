import React from 'react';
import { Flame, BarChart3, Trophy, Target, Snowflake, Bell, Droplet, Moon, Crown } from 'lucide-react';
import useScrollAnimation from '../hooks/useScrollAnimation';

export default function FeaturesSection() {
  const [sectionRef, isVisible] = useScrollAnimation(0.05);

  const features = [
    {
      icon: <Flame className="w-6 h-6 text-white" />,
      bgClass: 'bg-gradient-to-r from-streak to-gold',
      title: 'Streak Tracking',
      desc: 'Build powerful daily streaks and never break the chain. Get notified before your streak breaks.',
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-white" />,
      bgClass: 'bg-gradient-to-r from-primary to-primaryLight',
      title: 'Deep Analytics',
      desc: 'See your completion trends, best days, category breakdown, and 365-day heatmap. (Pro)',
    },
    {
      icon: <Trophy className="w-6 h-6 text-white" />,
      bgClass: 'bg-gradient-to-r from-gold to-warning',
      title: 'Earn Rewards',
      desc: 'Level up, earn XP, collect badges, and climb leaderboards. Make habit building fun!',
    },
    {
      icon: <Target className="w-6 h-6 text-white" />,
      bgClass: 'bg-gradient-to-r from-accent to-emerald-400',
      title: 'Smart Challenges',
      desc: 'Join 7-day, 21-day, and 30-day challenges. Compete with thousands of users worldwide.',
    },
    {
      icon: <Snowflake className="w-6 h-6 text-white" />,
      bgClass: 'bg-gradient-to-r from-blue-400 to-cyan-500',
      title: 'Streak Freezes',
      desc: 'Life happens. Use streak freezes to protect your progress on days you can\'t check in.',
    },
    {
      icon: <Bell className="w-6 h-6 text-white" />,
      bgClass: 'bg-gradient-to-r from-warning to-amber-500',
      title: 'Smart Reminders',
      desc: 'Set custom reminder times for each habit. Never forget to check in again. (Pro)',
    },
    {
      icon: <Droplet className="w-6 h-6 text-white" />,
      bgClass: 'bg-gradient-to-r from-cyan-400 to-blue-500',
      title: 'Measurable Goals',
      desc: 'Track quantity-based habits like glasses of water, pages read, or km walked. (Pro)',
    },
    {
      icon: <Moon className="w-6 h-6 text-white" />,
      bgClass: 'bg-gradient-to-r from-purple-500 to-indigo-500',
      title: 'Dark & Light Mode',
      desc: 'Beautiful dark mode by default. Switch to light mode anytime from settings.',
    },
    {
      icon: <Crown className="w-6 h-6 text-white" />,
      bgClass: 'bg-gradient-to-r from-gold to-warning',
      title: 'HabitFlow Pro',
      desc: 'Unlock unlimited habits, full analytics, personal insights, and more — at just ₹19/month.',
      isSpecial: true,
    },
  ];

  const handlePricingScroll = () => {
    const element = document.getElementById('pricing');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="features"
      ref={sectionRef}
      className="py-24 bg-background relative overflow-hidden"
    >
      {/* Background radial glow */}
      <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div
          className={`text-center max-w-2xl mx-auto mb-16 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'
          }`}
        >
          <span className="text-xs uppercase font-extrabold tracking-[2px] text-primary">
            FEATURES
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">
            Why HabitFlow?
          </h2>
          <p className="text-textSecondary text-base sm:text-lg mt-4 leading-relaxed">
            Everything you need to build habits that actually last
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`p-6 bg-card border rounded-2xl transition-all duration-300 flex flex-col items-start text-left hover:scale-[1.02] ${
                feature.isSpecial
                  ? 'border-warning/60 shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)]'
                  : 'border-borderCustom/50 hover:border-primary/30 hover:shadow-[0_0_30px_-10px_rgba(99,102,241,0.15)]'
              } transition-all duration-700 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-[30px]'
              }`}
              style={{
                transitionDelay: isVisible ? `${idx * 60}ms` : '0ms'
              }}
            >
              {/* Icon Container */}
              <div className={`w-12 h-12 rounded-xl ${feature.bgClass} flex items-center justify-center shadow-md mb-6`}>
                {feature.icon}
              </div>

              {/* Title */}
              <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                {feature.title}
                {feature.isSpecial && (
                  <span className="text-[10px] bg-warning/20 text-warning font-bold px-2 py-0.5 rounded-full">Pro</span>
                )}
              </h4>

              {/* Description */}
              <p className="text-sm text-textSecondary leading-relaxed mb-4 flex-grow">
                {feature.desc}
              </p>

              {/* CTA link if Pro card */}
              {feature.isSpecial && (
                <button 
                  onClick={handlePricingScroll}
                  className="text-xs font-extrabold text-warning hover:text-gold flex items-center gap-1.5 transition-colors duration-200 mt-auto cursor-pointer"
                >
                  See Pro Features →
                </button>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
