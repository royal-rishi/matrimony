import React from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ScreenshotsSection from './components/ScreenshotsSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import PricingSection from './components/PricingSection';
import TestimonialsSection from './components/TestimonialsSection';
import StatsSection from './components/StatsSection';
import FAQSection from './components/FAQSection';
import FinalCTASection from './components/FinalCTASection';
import Footer from './components/Footer';

function App() {
  return (
    <div className="bg-background text-textPrimary selection:bg-primary/30 selection:text-white overflow-hidden min-h-screen flex flex-col">
      {/* 1. Navbar */}
      <Navbar />

      {/* 2. Hero Section */}
      <HeroSection />

      {/* 3. App Preview Section */}
      <ScreenshotsSection />

      {/* 4. Features Grid Section */}
      <FeaturesSection />

      {/* 5. How It Works Section */}
      <HowItWorksSection />

      {/* 6. Pricing Section */}
      <PricingSection />

      {/* 7. Testimonials Section */}
      <TestimonialsSection />

      {/* 8. Stats / Social Proof Banner */}
      <StatsSection />

      {/* 9. FAQ Section */}
      <FAQSection />

      {/* 10. Final Call To Action */}
      <FinalCTASection />

      {/* 11. Footer Section */}
      <Footer />
    </div>
  );
}

export default App;
