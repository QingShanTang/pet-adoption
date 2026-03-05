import { createClient } from '@/lib/supabase/server'
import ApplicationReviewRow from '@/components/admin/ApplicationReviewRow'

export default async function AdminApplicationsPage() {
  const supabase = await createClient()
  const { data: applications } = await supabase
    .from('applications')
    .select('*, pet:pets(*), profile:profiles(*)')
    .order('created_at', { ascending: false })

  const pending = applications?.filter(a => a.status === 'pending') ?? []
  const reviewed = applications?.filter(a => a.status !== 'pending') ?? []

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">领养申请审核</h1>
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 mb-2">待审核 ({pending.length})</h2>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">申请人</th>
                <th className="text-left px-4 py-3">宠物</th>
                <th className="text-left px-4 py-3">申请说明</th>
                <th className="text-left px-4 py-3">申请时间</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400">暂无待审核申请</td></tr>
              ) : pending.map(app => <ApplicationReviewRow key={app.id} application={app} />)}
            </tbody>
          </table>
        </div>
      </section>
      {reviewed.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">已处理 ({reviewed.length})</h2>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3">申请人</th>
                  <th className="text-left px-4 py-3">宠物</th>
                  <th className="text-left px-4 py-3">申请说明</th>
                  <th className="text-left px-4 py-3">申请时间</th>
                  <th className="px-4 py-3">状态</th>
                </tr>
              </thead>
              <tbody>
                {reviewed.map(app => <ApplicationReviewRow key={app.id} application={app} />)}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}