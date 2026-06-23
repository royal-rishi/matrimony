import React from 'react';
import { PenTool, CheckCircle2, BarChart2 } from 'lucide-react';
import useScrollAnimation from '../hooks/useScrollAnimation';

export default function HowItWorksSection() {
  const [sectionRef, isVisible] = useScrollAnimation(0.05);

  const steps = [
    {
      number: '01',
      icon: <PenTool className="w-6 h-6 text-white" />,
      bgClass: 'from-primary to-primaryLight shadow-primary/20',
      title: 'Create Your Habits',
      desc: 'Add habits you want to build. Choose from templates or create custom ones. Set frequency, reminders, and goals.',
    },
    {
      number: '02',
      icon: <CheckCircle2 className="w-6 h-6 text-white" />,
      bgClass: 'from-accent to-emerald-400 shadow-accent/20',
      title: 'Check In Every Day',
      desc: 'One tap to mark a habit done. Add notes, track quantities, and build your daily streak.',
    },
    {
      number: '03',
      icon: <BarChart2 className="w-6 h-6 text-white" />,
      bgClass: 'from-gold to-warning shadow-warning/20',
      title: 'Track & Level Up',
      desc: 'See your progress in beautiful charts. Earn XP, unlock badges, and compete in challenges.',
    },
  ];

  const scrollToHeroDownload = () => {
    const element = document.getElementById('hero-download');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="py-24 bg-[#0F1117] relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-1/2 left-[-10%] w-[300px] h-[300px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        
        {/* Section Header */}
        <div
          className={`max-w-2xl mx-auto mb-20 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'
          }`}
        >
          <span className="text-xs uppercase font-extrabold tracking-[2px] text-accent">
            HOW IT WORKS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">
            Start building habits in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              3 simple steps
            </span>
          </h2>
        </div>

        {/* Steps Container */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 items-start max-w-5xl mx-auto mb-16">
          
          {/* Dashed connector line for desktop */}
          <div className="absolute top-14 left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-borderCustom/50 hidden md:block z-0" />

          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center relative z-10 transition-all duration-1000 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'
              }`}
              style={{
                transitionDelay: isVisible ? `${idx * 200}ms` : '0ms'
              }}
            >
              {/* Background large numbers */}
              <div className="absolute -top-10 select-none text-[72px] sm:text-[96px] font-black text-white/[0.02] tracking-tighter leading-none z-0">
                {step.number}
              </div>

              {/* Icon Circle */}
              <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${step.bgClass} flex items-center justify-center shadow-lg mb-6 relative z-10 border-4 border-[#0F1117]`}>
                {step.icon}
              </div>

              {/* Title */}
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 z-10">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-textSecondary leading-relaxed max-w-[260px] z-10">
                {step.desc}
              </p>
            </div>
          ))}

        </div>

        {/* CTA Button */}
        <div 
          className={`transition-all duration-1000 delay-800 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <button
            onClick={scrollToHeroDownload}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primaryLight hover:brightness-110 active:scale-95 transition-all duration-200 text-white text-sm font-bold px-8 py-3.5 rounded-xl cursor-pointer shadow-lg shadow-primary/20"
          >
            Ready to start? Download Free →
          </button>
        </div>

      </div>
    </section>
  );
}
