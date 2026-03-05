import type { Application, ApplicationStatus } from '@/types'
import Link from 'next/link'

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; className: string }> = {
  pending:  { label: '审核中', className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '已通过', className: 'bg-green-100 text-green-700' },
  rejected: { label: '已拒绝', className: 'bg-red-100 text-red-700' },
}

export default function ApplicationCard({ application }: { application: Application }) {
  const { label, className } = STATUS_CONFIG[application.status]
  const pet = application.pet

  return (
    <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
      <div className="text-3xl">{pet?.species === 'cat' ? '🐱' : pet?.species === 'dog' ? '🐶' : '🐾'}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800">{pet?.name ?? '未知宠物'}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${className}`}>{label}</span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5 truncate">{application.message}</p>
      </div>
      {pet && (
        <Link href={`/pets/${application.pet_id}`} className="text-sm text-orange-500 hover:underline shrink-0">
          查看宠物
        </Link>
      )}
    </div>
  )
}