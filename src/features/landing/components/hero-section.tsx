'use client'
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, Shield, Users, Search, Headset, UserCheck, Lock, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

import { RELIGIONS, INDIAN_STATES, EDUCATION_LEVELS } from '@/lib/constants'

// Professions list
const PROFESSIONS = [
  'Software / IT', 'Management / HR', 'Finance / Banking', 'Medicine / Healthcare',
  'Education / Academy', 'Business / Self-Employed', 'Civil Services', 'Other'
]

// Floating Rose Petals definition
const petals = [
  { left: '4%', top: '15%', size: 'w-3 h-4', rotate: 'rotate-[45deg]', delay: '0s' },
  { left: '32%', top: '6%', size: 'w-2 h-3.5', rotate: 'rotate-[15deg]', delay: '1s' },
  { left: '55%', top: '10%', size: 'w-4.5 h-5', rotate: 'rotate-[75deg]', delay: '0.5s' },
  { left: '78%', top: '18%', size: 'w-3.5 h-4', rotate: 'rotate-[110deg]', delay: '2s' },
  { left: '18%', top: '50%', size: 'w-3 h-3.5', rotate: 'rotate-[30deg]', delay: '1.5s' },
  { left: '2%', top: '70%', size: 'w-4 h-4.5', rotate: 'rotate-[95deg]', delay: '0.7s' },
  { left: '92%', top: '60%', size: 'w-4 h-5', rotate: 'rotate-[60deg]', delay: '1.2s' },
  { left: '70%', top: '80%', size: 'w-2.5 h-3', rotate: 'rotate-[20deg]', delay: '2.5s' },
]

export function HeroSection() {
  const router = useRouter()

  // Search form states
  const [lookingFor, setLookingFor] = useState('')
  const [ageMin, setAgeMin] = useState('21')
  const [ageMax, setAgeMax] = useState('30')
  const [religion, setReligion] = useState('')
  const [motherTongue, setMotherTongue] = useState('')
  const [location, setLocation] = useState('')
  const [education, setEducation] = useState('')
  const [profession, setProfession] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (lookingFor) params.set('gender', lookingFor === 'female' ? 'female' : 'male')
    if (ageMin) params.set('ageMin', ageMin)
    if (ageMax) params.set('ageMax', ageMax)
    if (religion) params.set('religion', religion.toLowerCase())
    if (motherTongue) params.set('motherTongue', motherTongue.toLowerCase())
    if (location) params.set('location', location)
    if (education) params.set('education', education)
    if (profession) params.set('profession', profession)

    router.push(`/search?${params.toString()}`)
  }

  // Pre-generate age options 18 to 70
  const ageOptions = Array.from({ length: 53 }, (_, i) => String(18 + i))

  return (
    <section className="relative overflow-hidden min-h-[560px] flex items-center pt-8 pb-12 lg:pt-14 lg:pb-16">
      
      {/* Background Hero Banner Image (Centered Couple with blush pink gradient built-in) */}
      <div className="absolute inset-0 w-full h-full bg-[#FFF7FA] dark:bg-zinc-950 -z-10">
        <img
          src="/images/hero-bg.png"
          alt="RishtaJoro Matrimony Couple"
          className="w-full h-full object-cover object-center pointer-events-none"
        />
        {/* Soft wash overlay for readability */}
        <div className="absolute inset-0 bg-white/10 dark:bg-black/40 pointer-events-none" />
      </div>

      {/* Background scattered rose petals */}
      {petals.map((petal, idx) => (
        <div
          key={idx}
          className={`absolute pointer-events-none text-rose-300/40 select-none animate-pulse ${petal.size} ${petal.rotate} -z-10`}
          style={{
            left: petal.left,
            top: petal.top,
            animationDelay: petal.delay,
            animationDuration: '4s',
          }}
        >
          <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
            <path d="M50 15 C20 40 25 70 50 85 C75 70 80 40 50 15 Z" />
          </svg>
        </div>
      ))}

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Hero Text */}
          <div className="lg:col-span-4 space-y-6 text-center lg:text-left bg-white/70 dark:bg-zinc-950/70 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none p-6 lg:p-0 rounded-2xl border border-white/40 lg:border-none shadow-lg lg:shadow-none">
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50/90 dark:bg-pink-950/30 border border-pink-100/85">
              <Shield className="h-3.5 w-3.5 text-pink-650" />
              <span className="text-[10px] font-bold tracking-wider text-pink-700 dark:text-pink-300 uppercase">
                Trusted by Thousands of Families
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-extrabold tracking-tight leading-[1.08] text-[#3c0f20] dark:text-white font-serif">
                Dil se Dil ka <br />
                <span className="text-pink-600 dark:text-pink-400 relative inline-block">
                  Milan
                  {/* Swirl heart flourish tail */}
                  <svg className="absolute left-[102%] top-[30%] w-28 h-10 text-pink-500 hidden sm:inline-block overflow-visible" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M0,15 C20,20 35,22 50,15 C65,8 75,10 80,18 C83,23 88,24 92,20 C96,16 95,8 90,6 C85,4 82,10 86,16 C90,22 98,18 100,12" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
              <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-350 leading-relaxed max-w-md mx-auto lg:mx-0 pt-2 font-semibold">
                Rishtajodo Matrimony is a trusted platform that connects hearts and families with trust, respect and values.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3.5 justify-center lg:justify-start pt-2">
              <Link
                href="/register"
                className="h-11 px-6 bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-md shadow-pink-200/50 dark:shadow-none hover:shadow-lg transition-all duration-300 rounded-lg text-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="h-4 w-4" />
                Register Free
              </Link>
              <Link
                href="/search"
                className="h-11 px-6 border border-pink-600 text-pink-600 bg-white dark:bg-zinc-900 hover:bg-pink-50/50 font-bold rounded-lg text-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Search className="h-4 w-4" />
                Search Partner
              </Link>
            </div>
          </div>

          {/* Center Column: Empty/Invisible Spacer so centered couple background shows through */}
          <div className="lg:col-span-4 hidden lg:block min-h-[400px] pointer-events-none" />

          {/* Right Column: Floating Matchmaker Card */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="w-full max-w-sm bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-zinc-150 dark:border-zinc-800/80 hover:shadow-2xl transition-all duration-300">
              <div className="text-center space-y-1 mb-5">
                <h3 className="text-xl font-bold text-[#3c0f20] dark:text-white tracking-tight font-serif">
                  Find Your Perfect Match
                </h3>
                <div className="flex items-center justify-center gap-1 text-pink-600">
                  <Heart className="h-3.5 w-3.5 fill-pink-600 text-pink-600" />
                </div>
              </div>

              <form onSubmit={handleSearch} className="space-y-3.5">
                {/* Row 1: Looking For & Religion */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="looking-for" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Looking For
                    </Label>
                    <select
                      id="looking-for"
                      className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs px-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-pink-500"
                      value={lookingFor}
                      onChange={(e) => setLookingFor(e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="female">Bride (Female)</option>
                      <option value="male">Groom (Male)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="religion" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Religion
                    </Label>
                    <select
                      id="religion"
                      className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs px-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-pink-500"
                      value={religion}
                      onChange={(e) => setReligion(e.target.value)}
                    >
                      <option value="">Select Religion</option>
                      {RELIGIONS.map((r) => (
                        <option key={r} value={r.toLowerCase()}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Age Range */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Age Range</Label>
                  <div className="grid grid-cols-5 gap-1.5 items-center">
                    <select
                      className="col-span-2 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs px-1 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-pink-500"
                      value={ageMin}
                      onChange={(e) => setAgeMin(e.target.value)}
                    >
                      {ageOptions.map((age) => (
                        <option key={`min-${age}`} value={age}>
                          {age} Yrs
                        </option>
                      ))}
                    </select>
                    <span className="text-center text-[10px] text-zinc-400 uppercase font-black">to</span>
                    <select
                      className="col-span-2 h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs px-1 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-pink-500"
                      value={ageMax}
                      onChange={(e) => setAgeMax(e.target.value)}
                    >
                      {ageOptions.map((age) => (
                        <option key={`max-${age}`} value={age}>
                          {age} Yrs
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 3: Location (State select dropdown) & Mother Tongue */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="location" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      State / Location
                    </Label>
                    <select
                      id="location"
                      className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs px-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-pink-500"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="mother-tongue" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Mother Tongue
                    </Label>
                    <select
                      id="mother-tongue"
                      className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs px-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-pink-500"
                      value={motherTongue}
                      onChange={(e) => setMotherTongue(e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="hindi">Hindi</option>
                      <option value="punjabi">Punjabi</option>
                      <option value="bengali">Bengali</option>
                      <option value="gujarati">Gujarati</option>
                      <option value="marathi">Marathi</option>
                      <option value="tamil">Tamil</option>
                      <option value="telugu">Telugu</option>
                      <option value="kannada">Kannada</option>
                      <option value="malayalam">Malayalam</option>
                      <option value="odia">Odia</option>
                      <option value="urdu">Urdu</option>
                      <option value="english">English</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Education & Profession */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="education" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Education
                    </Label>
                    <select
                      id="education"
                      className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs px-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-pink-500"
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                    >
                      <option value="">Select</option>
                      {EDUCATION_LEVELS.map((el) => (
                        <option key={el} value={el}>
                          {el}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="profession" className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Profession
                    </Label>
                    <select
                      id="profession"
                      className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs px-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-pink-500"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                    >
                      <option value="">Select</option>
                      {PROFESSIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  className="w-full h-10 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg shadow-md shadow-pink-200/50 dark:shadow-none hover:shadow-lg transition-all duration-300 mt-2 flex items-center justify-center gap-1.5 cursor-pointer text-xs uppercase"
                >
                  <Search className="h-4 w-4" />
                  Search Now
                </Button>
              </form>
            </div>
          </div>

        </div>

        {/* Stats Row: Floating Bar below Hero */}
        <div className="mt-14 max-w-5xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 shadow-xl p-4 sm:p-5 flex flex-col sm:grid sm:grid-cols-4 gap-6 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-150 dark:divide-zinc-800 text-center">
          
          {/* Stat 1 */}
          <div className="flex items-center gap-3.5 justify-center pb-4 sm:pb-0">
            <div className="h-10 w-10 rounded-full border border-pink-100 bg-pink-50 dark:bg-pink-950/20 flex items-center justify-center text-pink-600 dark:text-pink-400">
              <Users className="h-5 w-5" />
            </div>
            <div className="text-left leading-none">
              <p className="text-xl font-extrabold text-[#3c0f20] dark:text-white">5K+</p>
              <p className="text-[11px] text-zinc-500 font-semibold mt-1">Happy Families</p>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="flex items-center gap-3.5 justify-center pt-4 sm:pt-0 pb-4 sm:pb-0">
            <div className="h-10 w-10 rounded-full border border-pink-100 bg-pink-50 dark:bg-pink-950/20 flex items-center justify-center text-pink-600 dark:text-pink-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="text-left leading-none">
              <p className="text-xl font-extrabold text-[#3c0f20] dark:text-white">50k+</p>
              <p className="text-[11px] text-zinc-500 font-semibold mt-1">Verified Profiles</p>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="flex items-center gap-3.5 justify-center pt-4 sm:pt-0 pb-4 sm:pb-0">
            <div className="h-10 w-10 rounded-full border border-pink-100 bg-pink-50 dark:bg-pink-950/20 flex items-center justify-center text-pink-600 dark:text-pink-400">
              <Shield className="h-5 w-5" />
            </div>
            <div className="text-left leading-none">
              <p className="text-xl font-extrabold text-[#3c0f20] dark:text-white">100%</p>
              <p className="text-[11px] text-zinc-500 font-semibold mt-1">Privacy Protection</p>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="flex items-center gap-3.5 justify-center pt-4 sm:pt-0">
            <div className="h-10 w-10 rounded-full border border-pink-100 bg-pink-50 dark:bg-pink-950/20 flex items-center justify-center text-pink-600 dark:text-pink-400">
              <Headset className="h-5 w-5" />
            </div>
            <div className="text-left leading-none">
              <p className="text-xl font-extrabold text-[#3c0f20] dark:text-white">24/7</p>
              <p className="text-[11px] text-zinc-500 font-semibold mt-1">Support</p>
            </div>
          </div>

        </div>

        {/* Benefits Row Banner - match mockup exactly */}
        <div className="mt-8 max-w-5xl mx-auto bg-pink-50/50 dark:bg-zinc-900/50 border border-pink-100/60 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col md:grid md:grid-cols-4 gap-6 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-pink-100/60 dark:divide-zinc-800">
          {/* Benefit 1 */}
          <div className="flex items-start gap-3.5 px-2 pb-4 md:pb-0">
            <div className="h-8 w-8 rounded-full border border-pink-200 bg-white dark:bg-zinc-950 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0 mt-0.5 shadow-sm">
              <Shield className="h-4 w-4" />
            </div>
            <div className="text-left">
              <h4 className="text-[12px] font-bold text-[#3c0f20] dark:text-white">100% Verified Profiles</h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">All profiles are manually verified for your safety</p>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="flex items-start gap-3.5 px-4 pt-4 md:pt-0 pb-4 md:pb-0">
            <div className="h-8 w-8 rounded-full border border-pink-200 bg-white dark:bg-zinc-950 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0 mt-0.5 shadow-sm">
              <Lock className="h-4 w-4" />
            </div>
            <div className="text-left">
              <h4 className="text-[12px] font-bold text-[#3c0f20] dark:text-white">Privacy Protection</h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">Your privacy is our highest priority</p>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="flex items-start gap-3.5 px-4 pt-4 md:pt-0 pb-4 md:pb-0">
            <div className="h-8 w-8 rounded-full border border-pink-200 bg-white dark:bg-zinc-950 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0 mt-0.5 shadow-sm">
              <Award className="h-4 w-4" />
            </div>
            <div className="text-left">
              <h4 className="text-[12px] font-bold text-[#3c0f20] dark:text-white">Trusted Platform</h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">Trusted by thousands of families</p>
            </div>
          </div>

          {/* Benefit 4 */}
          <div className="flex items-start gap-3.5 px-4 pt-4 md:pt-0">
            <div className="h-8 w-8 rounded-full border border-pink-200 bg-white dark:bg-zinc-950 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0 mt-0.5 shadow-sm">
              <Headset className="h-4 w-4" />
            </div>
            <div className="text-left">
              <h4 className="text-[12px] font-bold text-[#3c0f20] dark:text-white">24/7 Support</h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">We are here to help you anytime</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
