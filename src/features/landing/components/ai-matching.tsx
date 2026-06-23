import { Sparkles, Brain, Check, BarChart, Compass } from 'lucide-react'

const coreMatchingPoints = [
  {
    title: 'Value & Beliefe Alignment',
    description: 'Compares perspectives on family dynamics, traditional values, and modern career views to highlight core sync.',
  },
  {
    title: 'Lifestyle & Habitation',
    description: 'Analyzes geographical preferences, dietary habits, and social settings to recommend compatible routines.',
  },
  {
    title: 'Career & Horizon Path',
    description: 'Takes into account education level, profession status, and future goals to find partners with matching ambitions.',
  },
]

export function AiMatching() {
  return (
    <section id="ai-matching" className="py-20 bg-zinc-50 dark:bg-zinc-950/40 relative overflow-hidden">
      {/* Soft circular glows */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 -z-10 h-[450px] w-[450px] rounded-full bg-pink-100/20 blur-3xl" />

      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        {/* Left column illustration/mockup of AI dashboard */}
        <div className="order-2 md:order-1 select-none">
          <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl shadow-xl shadow-pink-100/20 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-pink-50 dark:bg-pink-950/50 flex items-center justify-center text-pink-600">
                  <Brain className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">Rishtajodo Match Engine</h4>
                  <p className="text-[10px] text-zinc-400">Gemini-Powered Compatibility</p>
                </div>
              </div>
              <span className="text-xs bg-pink-50 dark:bg-pink-950 text-pink-700 dark:text-pink-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="h-3 w-3 fill-pink-500/20" /> Active
              </span>
            </div>

            {/* AI score chart mockup */}
            <div className="space-y-4">
              {/* Score ring */}
              <div className="flex justify-center items-center py-4 relative">
                {/* SVG Circular Progress Bar */}
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    stroke="#F3F4F6"
                    strokeWidth="8"
                    fill="transparent"
                    className="dark:stroke-zinc-800"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    stroke="url(#pinkGradient)"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray="326.7"
                    strokeDashoffset="32.6" /* 90% progress */
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E91E63" />
                      <stop offset="100%" stopColor="#FF4081" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-zinc-900 dark:text-white">90%</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600">Highly Compatible</span>
                </div>
              </div>

              {/* Progress metrics breakdown */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <BarChart className="h-3.5 w-3.5 text-zinc-400" /> Education & Career Match
                    </span>
                    <span className="text-zinc-900 dark:text-white">94%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 w-[94%]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Compass className="h-3.5 w-3.5 text-zinc-400" /> Lifestyle & Habit Match
                    </span>
                    <span className="text-zinc-900 dark:text-white">88%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 w-[88%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column description */}
        <div className="order-1 md:order-2 space-y-6 md:space-y-8 text-center md:text-left">
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-pink-600">
              AI Matching Engine
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Data-Driven Compatibility matching
            </p>
            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400">
              Our advanced matching model analyzes hundreds of value data points, including cultural background, personality structures, dietary habits, and life outlook. Instead of scrolling blindly, see exactly *why* you match.
            </p>
          </div>

          {/* Bullet points */}
          <div className="space-y-4">
            {coreMatchingPoints.map((point, idx) => (
              <div key={idx} className="flex gap-3 text-left">
                <div className="h-5 w-5 rounded-full bg-pink-100 dark:bg-pink-950/40 text-pink-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white leading-tight">
                    {point.title}
                  </h4>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mt-0.5 leading-normal">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
