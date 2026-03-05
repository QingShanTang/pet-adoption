import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DeletePetButton from '@/components/admin/DeletePetButton'

export default async function AdminPetsPage() {
  const supabase = await createClient()
  const { data: pets } = await supabase.from('pets').select('*').order('created_at', { ascending: false })

  const STATUS_LABEL = { available: '待领养', pending: '审核中', adopted: '已领养' }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">宠物管理</h1>
        <Link href="/admin/pets/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + 添加宠物
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">名称</th>
              <th className="text-left px-4 py-3">品种</th>
              <th className="text-left px-4 py-3">状态</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pets?.map(pet => (
              <tr key={pet.id}>
                <td className="px-4 py-3 font-medium">{pet.name}</td>
                <td className="px-4 py-3 text-gray-600">{pet.breed ?? pet.species}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                    {STATUS_LABEL[pet.status as keyof typeof STATUS_LABEL]}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <Link href={`/admin/pets/${pet.id}/edit`} className="text-blue-600 hover:underline mr-3">
                    编辑
                  </Link>
                  <DeletePetButton petId={pet.id} petName={pet.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}