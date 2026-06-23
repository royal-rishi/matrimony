import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const posts = [
  {
    title: 'Preparing Families for the First Matrimonial Meeting',
    summary: 'Essential tips on communication, setting mutual expectations, and organizing a successful initial family introduction meeting.',
    category: 'Marriage Tips',
    date: 'June 18, 2026',
    readTime: '5 min read',
  },
  {
    title: 'The Role of Values & Compatibility in Modern Marriage',
    summary: 'How aligning on career expectations, lifestyle choices, and family structures impacts long-term marital success in modern times.',
    category: 'Relationship Advice',
    date: 'June 15, 2026',
    readTime: '4 min read',
  },
  {
    title: 'Understanding Matrimonial KYC & Safety Standards',
    summary: 'A comprehensive guide explaining why Government ID verification and physical address checks are critical for a secure search.',
    category: 'Safety Guide',
    date: 'June 10, 2026',
    readTime: '6 min read',
  },
]

export function BlogSection() {
  return (
    <section className="py-20 bg-white dark:bg-zinc-950">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-pink-600">
            Latest Articles
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#3c0f20] dark:text-white font-serif">
            Marriage Tips & Relationship Advice
          </p>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400">
            Read expert-curated articles on navigating family introductions, evaluating match compatibility, and securing your search.
          </p>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl p-6 hover:shadow-xl hover:border-pink-200 transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Meta details */}
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-pink-600">
                  <span className="bg-pink-50 dark:bg-pink-950/20 px-2.5 py-1 rounded-full">{post.category}</span>
                  <span className="text-zinc-400 font-semibold">{post.readTime}</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white leading-snug group-hover:text-pink-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">
                    {post.summary}
                  </p>
                </div>
              </div>

              {/* Bottom footer */}
              <div className="flex justify-between items-center border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-6">
                <span className="text-[10px] text-zinc-400 font-semibold">{post.date}</span>
                <Link
                  href="#"
                  className="text-xs font-bold text-pink-650 hover:text-pink-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  Read Article
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
