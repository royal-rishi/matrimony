import { Check, Star, UserRound } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Free',
    price: '₹0',
    duration: 'Lifetime',
    description: 'Basic features to get you started on your search.',
    features: [
      'Create standard profile',
      'Basic search & filters',
      'Send interests to members',
      'Receive invitations',
    ],
    popular: false,
    matchmaker: false,
    cta: 'Register Free',
    href: '/register',
    cardClass: 'border-zinc-200/60 dark:border-zinc-800 hover:border-pink-300 hover:shadow-lg',
    btnClass: 'bg-zinc-50 hover:bg-pink-50 hover:text-pink-600 text-zinc-700 dark:bg-zinc-850 dark:text-zinc-300 border border-zinc-200/40 dark:border-zinc-800',
  },
  {
    name: 'Silver',
    price: '₹1,999',
    duration: '3 Months',
    description: 'Perfect for active seekers wanting direct contact.',
    features: [
      'View 50 verified contact numbers',
      'Direct chat with matches',
      'Standout profile tag',
      'Standard customer support',
    ],
    popular: false,
    matchmaker: false,
    cta: 'Upgrade to Silver',
    href: '/register?plan=silver',
    cardClass: 'border-zinc-200/60 dark:border-zinc-800 hover:border-pink-300 hover:shadow-lg',
    btnClass: 'bg-zinc-50 hover:bg-pink-50 hover:text-pink-600 text-zinc-700 dark:bg-zinc-850 dark:text-zinc-300 border border-zinc-200/40 dark:border-zinc-800',
  },
  {
    name: 'Gold',
    price: '₹3,999',
    duration: '6 Months',
    description: 'Our most popular plan with assisted benefits.',
    features: [
      'View 150 verified contact numbers',
      'Direct chat with matches',
      'Highlighted search results',
      '1 Relationship Coordinator call/month',
      'Priority support response',
    ],
    popular: true,
    matchmaker: false,
    cta: 'Upgrade to Gold',
    href: '/register?plan=gold',
    cardClass: 'border-pink-500 shadow-xl shadow-pink-100/30 dark:shadow-none -translate-y-2',
    btnClass: 'bg-pink-600 hover:bg-pink-700 text-white shadow-md shadow-pink-200/50 hover:shadow-lg',
  },
  {
    name: 'Matchmaker Assist',
    price: '₹4,999',
    duration: '6 Months',
    description: 'Hire a dedicated local associate to screen & introduce the best matches personally.',
    features: [
      'Dedicated Personal Matchmaker',
      'Offline candidate screening',
      'Direct chat with your matchmaker',
      '100 verified contact number views',
      'Direct family introductions',
    ],
    popular: false,
    matchmaker: true,
    cta: 'Hire a Matchmaker',
    href: '/register?plan=associate_assist',
    cardClass: 'border-rose-400 shadow-xl shadow-rose-100/30 dark:shadow-none -translate-y-1',
    btnClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200/50 hover:shadow-lg',
  },
  {
    name: 'Platinum',
    price: '₹7,999',
    duration: '12 Months',
    description: 'Full access with a dedicated local associate.',
    features: [
      'Unlimited contact number views',
      'Dedicated Personal Matchmaker',
      'Direct family introductions',
      'Offline match meeting support',
      'Advanced AI compatibility matching',
    ],
    popular: false,
    matchmaker: false,
    cta: 'Upgrade to Platinum',
    href: '/register?plan=platinum',
    cardClass: 'border-zinc-200/60 dark:border-zinc-800 hover:border-purple-300 hover:shadow-lg',
    btnClass: 'bg-zinc-50 hover:bg-purple-50 hover:text-purple-700 text-zinc-700 dark:bg-zinc-850 dark:text-zinc-300 border border-zinc-200/40 dark:border-zinc-800',
  },
]

export function MembershipPlans() {
  return (
    <section id="pricing" className="py-20 bg-pink-50/20 dark:bg-zinc-950/40 border-y border-pink-100/60 dark:border-zinc-800/60">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-pink-600">
            Membership Plans
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#3c0f20] dark:text-white font-serif">
            Premium Features for Faster Success
          </p>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400">
            Upgrade your membership to gain access to direct contact details, highlighted profiles, and dedicated local matchmaker support.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={cn(
                "relative rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 border bg-white dark:bg-zinc-900/60 backdrop-blur-md",
                plan.cardClass
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-pink-500 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md shadow-pink-200/40">
                  <Star className="h-3 w-3 fill-white" />
                  Most Popular
                </span>
              )}
              {plan.matchmaker && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md shadow-rose-200/40 whitespace-nowrap">
                  <UserRound className="h-3 w-3" />
                  Personal Matchmaker
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-[#3c0f20] dark:text-white font-serif">
                    {plan.name}
                  </h3>
                  <p className="text-zinc-400 text-xs mt-1 leading-snug">
                    {plan.description}
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-zinc-400 text-xs font-semibold uppercase">
                    / {plan.duration}
                  </span>
                </div>

                {/* Features List */}
                <ul className="space-y-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2 text-zinc-650 dark:text-zinc-300 leading-snug">
                      <Check className={cn("h-4 w-4 shrink-0 mt-0.5", plan.matchmaker ? "text-rose-500" : "text-pink-600")} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                <Link
                  href={plan.href}
                  className={cn(
                    "w-full h-10 rounded-lg text-xs font-bold uppercase flex items-center justify-center transition-all duration-300",
                    plan.btnClass
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

