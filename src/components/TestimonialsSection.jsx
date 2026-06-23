import React from 'react';
import useScrollAnimation from '../hooks/useScrollAnimation';

export default function TestimonialsSection() {
  const [sectionRef, isVisible] = useScrollAnimation(0.05);

  const testimonials = [
    {
      stars: 5,
      quote: "HabitFlow ne meri morning routine completely badal di! 45 din ka streak chal raha hai. Best app ever!",
      name: "Priya S.",
      initials: "PS",
      avatarBg: "bg-primary",
      city: "Mumbai",
      habit: "Morning Routine"
    },
    {
      stars: 5,
      quote: "The streak feature is so addictive! I've never been this consistent with my workout routine. 🔥",
      name: "Rahul K.",
      initials: "RK",
      avatarBg: "bg-accent",
      city: "Bangalore",
      habit: "Fitness"
    },
    {
      stars: 5,
      quote: "Pro subscription at ₹19 is a steal. Full analytics helped me understand my patterns. Highly recommend!",
      name: "Anjali M.",
      initials: "AM",
      avatarBg: "bg-warning",
      city: "Delhi",
      habit: "Study"
    },
    {
      stars: 5,
      quote: "Challenges feature is amazing! Competed with 200 people in the 21-day meditation challenge. Won! 🏆",
      name: "Vikram P.",
      initials: "VP",
      avatarBg: "bg-error",
      city: "Chennai",
      habit: "Mindfulness"
    },
    {
      stars: 5,
      quote: "Simple UI, beautiful design, and the badge system keeps me motivated. My kids also use it now! 😄",
      name: "Sunita R.",
      initials: "SR",
      avatarBg: "bg-purple-600",
      city: "Pune",
      habit: "Health"
    },
    {
      stars: 5,
      quote: "Finally an Indian app that actually works! Customer support is also very responsive. 5 stars easily!",
      name: "Arjun T.",
      initials: "AT",
      avatarBg: "bg-cyan-600",
      city: "Hyderabad",
      habit: "Custom Habits"
    }
  ];

  return (
    <section
      ref={sectionRef}
      className="py-24 bg-[#0F1117] border-y border-borderCustom/30 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        
        {/* Section Header */}
        <div
          className={`max-w-2xl mx-auto mb-16 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'
          }`}
        >
          <span className="text-xs uppercase font-extrabold tracking-[2px] text-accent">
            TESTIMONIALS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">
            Loved by habit builders{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              across India
            </span>
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className={`p-6 bg-card border border-borderCustom/50 hover:border-primary/20 rounded-2xl flex flex-col justify-between text-left transition-all duration-300 hover:scale-[1.02] transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'
              }`}
              style={{
                transitionDelay: isVisible ? `${idx * 80}ms` : '0ms'
              }}
            >
              <div>
                {/* Stars Row */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.stars)].map((_, i) => (
                    <span key={i} className="text-primary text-sm">⭐</span>
                  ))}
                </div>

                {/* Quote */}
                <p className="text-sm sm:text-base text-textPrimary italic font-medium leading-relaxed mb-6">
                  "{t.quote}"
                </p>
              </div>

              {/* User Metadata */}
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${t.avatarBg} flex items-center justify-center text-xs font-bold text-white shadow-md shadow-black/35`}>
                  {t.initials}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-xs sm:text-sm font-bold text-white">{t.name}</span>
                  <span className="text-[10px] text-textSecondary mt-1">
                    {t.city} · Tracking <span className="text-primary font-bold">{t.habit}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
