'use client'

import React, { useState } from 'react'
import { ReviewsList, DisputesList } from '@/features/associate'
import { Star, AlertTriangle } from 'lucide-react'

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<'reviews' | 'disputes'>('reviews')

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 pb-4 border-b-2 transition cursor-pointer ${
            activeTab === 'reviews'
              ? 'border-rose-500 text-rose-500 font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <Star size={16} />
          Client Reviews
        </button>
        <button
          onClick={() => setActiveTab('disputes')}
          className={`flex items-center gap-2 pb-4 border-b-2 transition cursor-pointer ${
            activeTab === 'disputes'
              ? 'border-rose-500 text-rose-500 font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <AlertTriangle size={16} />
          Territorial Disputes
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'reviews' ? <ReviewsList /> : <DisputesList />}
      </div>
    </div>
  )
}
