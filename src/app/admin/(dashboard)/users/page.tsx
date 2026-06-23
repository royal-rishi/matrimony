import { UsersDatatable } from '@/features/admin'

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
            User Profiles Directory
          </h1>
          <p className="text-sm text-gray-500 mt-1 leading-none">
            Query standard profiles metadata, apply bans or merge duplicates.
          </p>
        </div>
      </div>
      <UsersDatatable />
    </div>
  )
}
