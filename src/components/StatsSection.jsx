import React, { useRef, useState, useEffect } from 'react';
import useCountUp from '../hooks/useCountUp';

export default function StatsSection() {
  const [startCount, setStartCount] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStartCount(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    const currentSection = sectionRef.current;
    if (currentSection) {
      observer.observe(currentSection);
    }

    return () => {
      if (currentSection) {
        observer.unobserve(currentSection);
      }
    };
  }, []);

  const usersCount = useCountUp(10000, 2000, startCount);
  const habitsCount = useCountUp(500000, 2000, startCount);
  const priceCount = useCountUp(19, 1500, startCount);
  const ratingCount = useCountUp(48, 1500, startCount);

  // Formatting helpers
  const formatNumber = (num, hasComma = true) => {
    if (num === 0) return '0';
    if (!hasComma) return num.toString();
    
    // For habitsCount (5,00,000+) - use Indian numbering system formatting
    if (num > 99999) {
      return num.toLocaleString('en-IN');
    }
    return num.toLocaleString('en-US');
  };

  return (
    <section
      ref={sectionRef}
      className="py-16 bg-gradient-to-r from-primary via-[#4F46E5] to-[#3730A3] w-full relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 justify-items-center text-center">
        
        {/* Stat 1 */}
        <div className="flex flex-col items-center w-full">
          <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            {formatNumber(usersCount)}+
          </span>
          <span className="text-[11px] sm:text-xs text-white/70 font-semibold uppercase tracking-wider mt-2">
            Active Users
          </span>
        </div>

        {/* Divider 1 */}
        <div className="w-[1px] h-12 bg-white/20 hidden md:block self-center" />

        {/* Stat 2 */}
        <div className="flex flex-col items-center w-full">
          <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            {formatNumber(habitsCount)}+
          </span>
          <span className="text-[11px] sm:text-xs text-white/70 font-semibold uppercase tracking-wider mt-2">
            Habits Tracked
          </span>
        </div>

        {/* Divider 2 */}
        <div className="w-[1px] h-12 bg-white/20 hidden md:block self-center" />

        {/* Stat 3 */}
        <div className="flex flex-col items-center w-full">
          <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            ₹{priceCount}
          </span>
          <span className="text-[11px] sm:text-xs text-white/70 font-semibold uppercase tracking-wider mt-2">
            Per Month Only
          </span>
        </div>

        {/* Divider 3 */}
        <div className="w-[1px] h-12 bg-white/20 hidden md:block self-center" />

        {/* Stat 4 */}
        <div className="flex flex-col items-center w-full">
          <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            {(ratingCount / 10).toFixed(1)} ⭐
          </span>
          <span className="text-[11px] sm:text-xs text-white/70 font-semibold uppercase tracking-wider mt-2">
            Average Rating
          </span>
        </div>

      </div>
    </section>
  );
}
