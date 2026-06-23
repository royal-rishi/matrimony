'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, User, MapPin, Landmark, FileText, ChevronRight, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { associateSignUpAction } from '@/features/auth/actions/auth-actions'

export default function AssociateRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    mobile_number: '',
    role: 'local_associate',
    state: '',
    district: '',
    block: '',
    village_ward: '',
    aadhaar_number: '',
    pan_number: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    bank_holder_name: '',
    experience: '0',
    occupation: '',
    languages: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateStep = () => {
    setError(null)
    if (step === 1) {
      if (!formData.email.includes('@')) {
        setError('Please enter a valid email address.')
        return false
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.')
        return false
      }
      if (formData.password !== formData.confirm_password) {
        setError('Passwords do not match.')
        return false
      }
      if (!formData.role) {
        setError('Please select your associate level.')
        return false
      }
    } else if (step === 2) {
      if (formData.first_name.trim().length < 2) {
        setError('First name must be at least 2 characters.')
        return false
      }
      if (formData.last_name.trim().length < 1) {
        setError('Last name is required.')
        return false
      }
      if (formData.mobile_number.length !== 10 || isNaN(Number(formData.mobile_number))) {
        setError('Mobile number must be exactly 10 digits.')
        return false
      }
      if (!formData.state || !formData.district || !formData.block) {
        setError('State, District, and Block location parameters are required.')
        return false
      }
    } else if (step === 3) {
      if (formData.aadhaar_number.length !== 12 || isNaN(Number(formData.aadhaar_number))) {
        setError('Aadhaar number must be exactly 12 digits.')
        return false
      }
      if (formData.pan_number.length !== 10) {
        setError('PAN Card number must be exactly 10 alphanumeric characters.')
        return false
      }
      if (formData.bank_account_number.length < 8) {
        setError('Please enter a valid bank account number.')
        return false
      }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.bank_ifsc_code)) {
        setError('Invalid bank IFSC code (e.g. SBIN0012345).')
        return false
      }
      if (formData.bank_holder_name.trim().length < 3) {
        setError('Please enter the bank account holder name.')
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setError(null)
    setStep((prev) => prev - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (step === 4) {
      if (Number(formData.experience) < 0) {
        setError('Experience cannot be negative.')
        return
      }
      if (formData.occupation.trim().length < 2) {
        setError('Please enter your current occupation.')
        return
      }
      if (formData.languages.trim().length < 2) {
        setError('Please enter languages known.')
        return
      }
    }

    setIsLoading(true)

    try {
      const res = await associateSignUpAction({
        ...formData,
        role: formData.role as 'local_associate' | 'block_associate' | 'district_associate' | 'state_associate',
        experience: parseInt(formData.experience, 10),
      })

      if (res.error) {
        setError(res.error)
        toast.error('Application Submission Failed', { description: res.error })
      } else {
        toast.success('Associate application submitted!', {
          description: 'A confirmation email is sent. The territory hierarchy will review your KYC.',
        })
        router.push('/associate/login')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-y-auto py-12 px-4 font-sans">
      {/* Background gradients and blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-600/10 blur-[120px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl animate-in fade-in zoom-in-95 duration-500">
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-rose-950/20 text-slate-100">
          <CardHeader className="space-y-2 text-center border-b border-slate-800 pb-6">
            <div className="mx-auto mb-2 flex justify-center">
              <img
                src="/images/logo.png"
                alt="RishtaJoro Matrimonial"
                className="h-[54px] w-auto object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-rose-400 via-pink-300 to-rose-300 bg-clip-text text-transparent">
              Matchmaker Network Application
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Apply to become a verified RishtaJodo Territory Associate
            </CardDescription>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2 mt-4 pt-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s === step
                      ? 'w-8 bg-rose-500'
                      : s < step
                      ? 'w-4 bg-pink-600'
                      : 'w-2 bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/40 text-rose-300 text-xs border border-rose-900/50 animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <form onSubmit={step === 4 ? handleSubmit : (e) => e.preventDefault()} className="space-y-4">
              {/* STEP 1: Account Credentials & Role */}
              {step === 1 && (
                <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <User className="h-4 w-4" /> Account & Role Level
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-700 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-700 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirm Password</Label>
                      <Input
                        id="confirm_password"
                        name="confirm_password"
                        type="password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-700 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Associate Level Role</Label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full h-10 px-3 bg-slate-950/50 border border-slate-800 text-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
                    >
                      <option value="local_associate">Local Associate (Interacts with Users)</option>
                      <option value="block_associate">Block Associate (Supervises Locals)</option>
                      <option value="district_associate">District Associate (Supervises Blocks)</option>
                      <option value="state_associate">State Associate (Supervises Districts)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 2: Personal & Location Details */}
              {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <MapPin className="h-4 w-4" /> Personal & Territory Details
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Jane"
                        className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-700 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        type="text"
                        value={formData.last_name}
                        onChange={handleChange}
                        placeholder="Doe"
                        className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-700 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile_number">Mobile Number</Label>
                    <Input
                      id="mobile_number"
                      name="mobile_number"
                      type="text"
                      maxLength={10}
                      value={formData.mobile_number}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-700 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        type="text"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="Uttar Pradesh"
                        className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-700 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="district">District</Label>
                      <Input
                        id="district"
                        name="district"
                        type="text"
                        value={formData.district}
                        onChange={handleChange}
                        placeholder="Lucknow"
                        className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-700 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="block">Block</Label>
                      <Input
                        id="block"
                        name="block"
                        type="text"
                        value={formData.block}
                        onChange={handleChange}
                        placeholder="Chinhat"
                        className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-700 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="village_ward">Village / Ward / Municipality (Optional)</Label>
                    <Input
                      id="village_ward"
                      name="village_ward"
                      type="text"
                      value={formData.village_ward}
                      onChange={handleChange}
                      placeholder="Ward No. 12"
                      className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-700 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: KYC Identity & Bank Verification */}
              {step === 3 && (
                <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <Landmark className="h-4 w-4" /> KYC & Bank Details
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aadhaar_number">Aadhaar Card Number (12 digits)</Label>
                      <Input
                        id="aadhaar_number"
                        name="aadhaar_number"
                        type="text"
                        maxLength={12}
                        value={formData.aadhaar_number}
                        onChange={handleChange}
                        placeholder="123456789012"
                        className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-700 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pan_number">PAN Card Number</Label>
                      <Input
                        id="pan_number"
                        name="pan_number"
                        type="text"
                        maxLength={10}
                        value={formData.pan_number}
                        onChange={handleChange}
                        placeholder="ABCDE1234F"
                        className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-700 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_holder_name">Account Holder Name</Label>
                    <Input
                      id="bank_holder_name"
                      name="bank_holder_name"
                      type="text"
                      value={formData.bank_holder_name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-700 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bank_account_number">Bank Account Number</Label>
                      <Input
                        id="bank_account_number"
                        name="bank_account_number"
                        type="text"
                        value={formData.bank_account_number}
                        onChange={handleChange}
                        placeholder="1234567890"
                        className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-700 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bank_ifsc_code">Bank IFSC Code</Label>
                      <Input
                        id="bank_ifsc_code"
                        name="bank_ifsc_code"
                        type="text"
                        maxLength={11}
                        value={formData.bank_ifsc_code}
                        onChange={handleChange}
                        placeholder="SBIN0012345"
                        className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-700 focus-visible:ring-rose-500 focus-visible:border-rose-500 uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Professional Info */}
              {step === 4 && (
                <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <FileText className="h-4 w-4" /> Professional Profile
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input
                        id="experience"
                        name="experience"
                        type="number"
                        value={formData.experience}
                        onChange={handleChange}
                        placeholder="3"
                        className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-700 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="occupation">Current Occupation</Label>
                      <Input
                        id="occupation"
                        name="occupation"
                        type="text"
                        value={formData.occupation}
                        onChange={handleChange}
                        placeholder="Social Worker / Matchmaker"
                        className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-700 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="languages">Languages Known</Label>
                    <Input
                      id="languages"
                      name="languages"
                      type="text"
                      value={formData.languages}
                      onChange={handleChange}
                      placeholder="Hindi, English, Bengali"
                      className="bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-700 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                    />
                  </div>
                </div>
              )}
            </form>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-800 pt-6">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                className="border-slate-800 text-slate-300 hover:bg-slate-900 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white font-semibold shadow-md cursor-pointer border-t border-white/10"
              >
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white font-semibold shadow-md cursor-pointer border-t border-white/10"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
        
        <p className="text-center text-xs text-slate-500 mt-6">
          Already registered?{' '}
          <Link href="/associate/login" className="text-rose-400 hover:underline hover:text-rose-300 transition-colors">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}
