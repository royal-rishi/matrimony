import React from 'react';
import DownloadButtons from './DownloadButtons';
import useScrollAnimation from '../hooks/useScrollAnimation';

export default function FinalCTASection() {
  const [sectionRef, isVisible] = useScrollAnimation(0.05);

  return (
    <section
      ref={sectionRef}
      className="py-32 bg-background relative overflow-hidden text-center"
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#6366F115_0%,transparent_60%)] pointer-events-none" />

      {/* Floating blurred circles */}
      <div className="absolute left-[-10%] top-1/4 w-[250px] h-[250px] rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
      <div className="absolute right-[-10%] bottom-1/4 w-[200px] h-[200px] rounded-full bg-accent/5 blur-[80px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10 flex flex-col items-center">
        {/* Animated Rocket Emoji */}
        <div 
          className={`text-5xl sm:text-6xl mb-8 animate-[bounce_2s_infinite] select-none transition-all duration-1000 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
        >
          <span role="img" aria-label="rocket">🚀</span>
        </div>

        {/* Heading */}
        <h2 
          className={`text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-6 transition-all duration-1000 delay-100 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'
          }`}
        >
          Ready to build habits that <br />
          <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
            change your life?
          </span>
        </h2>

        {/* Subtext */}
        <p 
          className={`text-lg sm:text-xl text-textSecondary max-w-xl leading-relaxed mb-10 transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'
          }`}
        >
          Join <span className="text-white font-bold">10,000+</span> people who have transformed their daily routine with HabitFlow. Free forever.
        </p>

        {/* Reusable Download Buttons */}
        <div 
          className={`mb-8 w-full flex justify-center transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <DownloadButtons size="normal" alignment="center" />
        </div>

        {/* Fine Print */}
        <span 
          className={`text-xs text-textDisabled font-medium uppercase tracking-wider transition-all duration-1000 delay-400 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Free to download · No credit card required · Available on Android · iOS coming soon
        </span>
      </div>
    </section>
  );
}
