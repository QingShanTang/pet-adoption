'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Application, ApplicationStatus } from '@/types'

export default function ApplicationReviewRow({ application }: { application: Application }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateStatus(status: ApplicationStatus) {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('applications').update({ status }).eq('id', application.id)

    if (status === 'approved') {
      await supabase.from('pets').update({ status: 'adopted' }).eq('id', application.pet_id)
    }
    router.refresh()
  }

  return (
    <tr className="border-b">
      <td className="px-4 py-3">
        <div className="font-medium">{application.profile?.name ?? '未知'}</div>
        <div className="text-xs text-gray-500">{application.profile?.phone}</div>
      </td>
      <td className="px-4 py-3 font-medium">{application.pet?.name}</td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{application.message}</td>
      <td className="px-4 py-3 text-sm">
        {new Date(application.created_at).toLocaleDateString('zh-CN')}
      </td>
      <td className="px-4 py-3">
        {application.status === 'pending' ? (
          <div className="flex gap-2">
            <button onClick={() => updateStatus('approved')} disabled={loading}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50">
              通过
            </button>
            <button onClick={() => updateStatus('rejected')} disabled={loading}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50">
              拒绝
            </button>
          </div>
        ) : (
          <span className={`text-sm ${application.status === 'approved' ? 'text-green-600' : 'text-red-500'}`}>
            {application.status === 'approved' ? '已通过' : '已拒绝'}
          </span>
        )}
      </td>
    </tr>
  )
}