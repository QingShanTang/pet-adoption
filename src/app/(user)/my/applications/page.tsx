import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ApplicationCard from '@/components/applications/ApplicationCard'

export default async function MyApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/my/applications')

  const { data: applications } = await supabase
    .from('applications')
    .select('*, pet:pets(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">我的申请</h1>
      {!applications?.length ? (
        <p className="text-center text-gray-500 mt-12">还没有领养申请</p>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      )}
    </div>
  )
}