import React from 'react';

export default function DownloadButtons({ size = 'normal', alignment = 'start' }) {
  const isCompact = size === 'compact';
  
  const alignmentClass = alignment === 'center' 
    ? 'justify-center' 
    : alignment === 'end' 
      ? 'justify-end' 
      : 'justify-start';

  const containerPadding = isCompact ? 'px-4 py-2 rounded-lg gap-2' : 'px-6 py-3 rounded-xl gap-3';
  const iconSize = isCompact ? 'w-5 h-5' : 'w-6 h-6';
  const labelTextSize = isCompact ? 'text-[8px]' : 'text-[9px]';
  const mainTextSize = isCompact ? 'text-sm' : 'text-base';
  const btnHeight = isCompact ? 'h-11' : 'h-[52px]';

  return (
    <div className={`flex flex-col sm:flex-row items-center ${alignmentClass} gap-4 w-full sm:w-auto`}>
      {/* Google Play Button */}
      <a
        href="https://drive.google.com/file/d/1dU7Kzu9IgaG1jajvSzTRUQWDx6clishL/view?usp=drive_link"
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center bg-white border border-transparent hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer w-full sm:w-auto ${btnHeight} ${containerPadding}`}
      >
        {/* Google Play SVG Logo */}
        <svg className={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 20.25V3.75C3 3.1 3.5 2.62 4.13 2.87L20.15 11.12C20.65 11.37 20.65 12.62 20.15 12.87L4.13 21.12C3.5 21.37 3 20.9 3 20.25Z" fill="#F4B400" />
          <path d="M3 12.0001V3.75012C3 3.10012 3.5 2.62012 4.13 2.87012L12.5 11.2401L3 12.0001Z" fill="#00E676" />
          <path d="M12.5 11.24L4.13 2.86997C4.07 2.89997 4.02 2.93997 3.97 2.97997L11.52 10.53L12.5 11.24Z" fill="#00b0ff" stroke="#00b0ff" strokeWidth="0.5" />
          <path d="M3 12L12.5 11.24L21.15 19.89C20.65 20.39 19.9 20.39 19.4 20.14L3 12Z" fill="#EA4335" />
          <path d="M3 12.0001V20.2501C3 20.9001 3.5 21.3801 4.13 21.1301L12.5 12.7601L3 12.0001Z" fill="#4285F4" />
        </svg>
        <div className="flex flex-col items-start leading-none text-left">
          <span className={`${labelTextSize} text-gray-500 font-medium mb-[2px]`}>GET IT ON</span>
          <span className={`${mainTextSize} font-bold text-gray-900`}>Google Play</span>
        </div>
      </a>

      {/* App Store Button */}
      <a
        href="https://drive.google.com/file/d/1dU7Kzu9IgaG1jajvSzTRUQWDx6clishL/view?usp=drive_link"
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center bg-[#1C1C1E] border border-[#3A3A3C] hover:border-white/50 hover:shadow-xl hover:shadow-primary/5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer w-full sm:w-auto ${btnHeight} ${containerPadding}`}
      >
        {/* Apple SVG Logo */}
        <svg className={iconSize} viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
        <div className="flex flex-col items-start leading-none text-left">
          <span className={`${labelTextSize} text-gray-400 font-medium mb-[2px]`}>Download on the</span>
          <span className={`${mainTextSize} font-bold text-white`}>App Store</span>
        </div>
      </a>
    </div>
  );
}
