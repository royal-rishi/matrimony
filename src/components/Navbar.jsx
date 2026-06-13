import React, { useState, useEffect } from 'react';
import { Menu, X, Download } from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToHeroDownload = () => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById('hero-download');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 h-16 z-50 transition-all duration-300 flex items-center ${
          isScrolled
            ? 'bg-background/95 backdrop-blur-md border-b border-borderCustom/50 shadow-lg'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-tr from-primary to-accent rounded-lg shadow-md shadow-primary/20">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex flex-col items-start leading-tight">
              <div className="flex items-center text-xl font-extrabold tracking-tight">
                <span className="text-white">Habit</span>
                <span className="text-primary ml-[2px]">Flow</span>
              </div>
              <span className="text-[10px] text-textSecondary font-medium hidden sm:inline">Build Better. One Day at a Time.</span>
            </div>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How It Works', 'Pricing', 'FAQ'].map((link) => {
              const id = link.toLowerCase().replace(/\s+/g, '-');
              return (
                <button
                  key={link}
                  onClick={() => handleNavClick(id)}
                  className="text-sm font-semibold text-textSecondary hover:text-white transition-colors duration-200 cursor-pointer"
                >
                  {link}
                </button>
              );
            })}
          </div>

          {/* Action Button - Desktop */}
          <div className="hidden md:block">
            <button
              onClick={scrollToHeroDownload}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-primaryLight hover:brightness-110 active:scale-95 transition-all duration-200 text-white text-[13px] font-bold px-5 py-2 rounded-lg cursor-pointer shadow-lg shadow-primary/20"
            >
              <Download className="w-4 h-4" />
              Download App
            </button>
          </div>

          {/* Mobile Menu Icon */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-textSecondary hover:text-white transition-colors duration-200 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Nav Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-background/98 backdrop-blur-lg md:hidden transition-all duration-300 flex flex-col justify-center items-center ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col items-center gap-8 text-center">
          {['Features', 'How It Works', 'Pricing', 'FAQ'].map((link) => {
            const id = link.toLowerCase().replace(/\s+/g, '-');
            return (
              <button
                key={link}
                onClick={() => handleNavClick(id)}
                className="text-2xl font-bold text-textSecondary hover:text-white transition-colors duration-200 cursor-pointer"
              >
                {link}
              </button>
            );
          })}
          <button
            onClick={scrollToHeroDownload}
            className="mt-4 flex items-center gap-2 bg-gradient-to-r from-primary to-primaryLight hover:brightness-110 active:scale-95 transition-all duration-200 text-white text-base font-bold px-8 py-3.. rounded-xl cursor-pointer shadow-lg shadow-primary/25"
          >
            <Download className="w-5 h-5" />
            Download App
          </button>
        </div>
      </div>
    </>
  );
}
