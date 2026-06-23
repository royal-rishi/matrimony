import { AssociateNetworkManager } from '@/features/admin'

export default function AdminAssociatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">
            Associates Network Directory
          </h1>
          <p className="text-sm text-gray-500 mt-1 leading-none">
            Oversee active regional agents network, verify credentials, and allocate territory bounds.
          </p>
        </div>
      </div>
      <AssociateNetworkManager />
    </div>
  )
}
