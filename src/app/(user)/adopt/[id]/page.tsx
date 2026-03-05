import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import AdoptForm from '@/components/adopt/AdoptForm'
import Link from 'next/link'

export default async function AdoptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirectTo=/adopt/${id}`)

  const { data: pet } = await supabase.from('pets').select('*').eq('id', id).single()
  if (!pet || pet.status !== 'available') notFound()

  return (
    <div>
      <Link href={`/pets/${id}`} className="text-sm text-orange-500 hover:underline mb-4 inline-block">
        ← 返回 {pet.name} 的详情
      </Link>
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-4">申请领养 {pet.name}</h1>
        <AdoptForm petId={pet.id} petName={pet.name} />
      </div>
    </div>
  )
}