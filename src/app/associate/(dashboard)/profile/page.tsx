import { 
  ShieldCheck, ShieldAlert, Landmark, User, Map, Wallet, Calendar 
} from 'lucide-react'
import { getAssociateProfileDetails } from '@/features/associate/actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'My Profile & KYC | Rishtajodo Associate',
  description: 'View your profile details, KYC status, registered bank account, and assigned territory bounds.',
}

export const dynamic = 'force-dynamic'

export default async function AssociateProfilePage() {
  const res = await getAssociateProfileDetails()
  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center text-rose-500 font-semibold bg-rose-950/25 border border-rose-900/50 rounded-xl">
        Failed to load associate profile data. Please try again.
      </div>
    )
  }

  const { profile, associate, kyc, bankAccount, territory } = res.data

  const formatRole = (roleStr: string) => {
    return (roleStr || '').replace('_', ' ').toUpperCase()
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-950 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            My Workspace Account
            {associate?.status === 'active' ? (
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-500" />
            )}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Oversee your active partner credentials, KYC verification checks, and territory bounds.
          </p>
        </div>
        <div>
          <Badge className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
            associate?.status === 'active' 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
          }`}>
            Account: {associate?.status || 'Pending KYC'}
          </Badge>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Personal Profile & Analytics */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Card 1: Personal Details */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-150 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-rose-500 flex items-center gap-2">
                <User className="h-4 w-4" /> Personal Information
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">Your profile details registered with RishtaJodo.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase">Full Name</span>
                  <p className="font-semibold text-gray-800 dark:text-gray-250">
                    {profile.first_name} {profile.last_name}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase">Associate Level</span>
                  <p className="font-semibold text-gray-800 dark:text-gray-250">
                    {formatRole(profile.role)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase">Mobile Number</span>
                  <p className="font-semibold text-gray-800 dark:text-gray-250">
                    {profile.mobile_number || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase">Email Address</span>
                  <p className="font-semibold text-gray-800 dark:text-gray-250">
                    {profile.email || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <span className="text-xs font-bold text-gray-400 uppercase">Professional Qualifications</span>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg border dark:border-gray-850 mt-1">
                    {profile.education || 'No qualification details logged.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Bank Account Details */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-150 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-rose-500 flex items-center gap-2">
                <Landmark className="h-4 w-4" /> Bank Account Credentials
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">Your payout bank details verified for commission transactions.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {bankAccount ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-400 uppercase">Account Holder</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-250">{bankAccount.account_holder_name}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-400 uppercase">Bank Name</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-250">{bankAccount.bank_name}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-400 uppercase">Account Number</span>
                    <p className="font-mono font-bold text-gray-800 dark:text-gray-250">{bankAccount.account_number}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-400 uppercase">IFSC Code</span>
                    <p className="font-mono font-bold text-gray-800 dark:text-gray-250">{bankAccount.ifsc_code}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2 pt-2 border-t dark:border-gray-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase">Verification Status</span>
                    <Badge className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      bankAccount.is_verified 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {bankAccount.is_verified ? 'Bank Verified' : 'Pending Verification'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-center py-6 text-xs text-gray-400 font-semibold">No bank account linked.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: KYC Review status & Territory bounds */}
        <div className="space-y-8">
          
          {/* Card 3: KYC Details */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-150 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-rose-500 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> KYC Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-sm">
              {kyc ? (
                <>
                  <div className="flex justify-between items-center pb-2 border-b dark:border-gray-850">
                    <span className="text-xs font-bold text-gray-400 uppercase">KYC Status</span>
                    <Badge className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      kyc.kyc_status === 'approved' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : kyc.kyc_status === 'rejected' 
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {kyc.kyc_status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-400 uppercase">National ID type</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-250 capitalize">{kyc.national_id_type}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-400 uppercase">National ID Number</span>
                    <p className="font-mono font-bold text-gray-800 dark:text-gray-250">{kyc.national_id_number}</p>
                  </div>
                  {kyc.verification_notes && (
                    <div className="space-y-1 pt-2 border-t dark:border-gray-850">
                      <span className="text-xs font-bold text-gray-400 uppercase">Verification Notes</span>
                      <p className="text-xs text-gray-500 leading-relaxed mt-1 bg-gray-50 dark:bg-gray-900/40 p-2.5 rounded-lg border dark:border-gray-850">
                        {kyc.verification_notes}
                      </p>
                    </div>
                  )}
                  {kyc.verified_at && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-2">
                      <Calendar className="h-3 w-3" />
                      <span>Verified: {new Date(kyc.verified_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center py-6 text-xs text-gray-400 font-semibold">KYC data not submitted.</p>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Territory Bounds */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-gray-150 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-rose-500 flex items-center gap-2">
                <Map className="h-4 w-4" /> Assigned Territory
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-sm">
              {territory ? (
                <>
                  <div className="flex justify-between items-center pb-2 border-b dark:border-gray-850">
                    <span className="text-xs font-bold text-gray-400 uppercase">Territory Scope</span>
                    <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider rounded">
                      {territory.level} level
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-400 uppercase">State Assignee</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-250">{territory.state}</p>
                  </div>
                  {territory.district && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-400 uppercase">District Assignee</span>
                      <p className="font-semibold text-gray-800 dark:text-gray-250">{territory.district}</p>
                    </div>
                  )}
                  {territory.block && (
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-400 uppercase">Block Assignee</span>
                      <p className="font-semibold text-gray-800 dark:text-gray-250">{territory.block}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center py-6 text-xs text-gray-400 font-semibold">No active territory mapped.</p>
              )}
            </CardContent>
          </Card>

          {/* Wallet Balance Summary Card */}
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 rounded-xl text-rose-500">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase">Wallet Balance</h4>
                  <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                    ₹ {(associate?.wallet_balance || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
