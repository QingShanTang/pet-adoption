import Link from 'next/link'
import PetForm from '@/components/admin/PetForm'

export default function NewPetPage() {
  return (
    <div>
      <Link href="/admin/pets" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        ← 返回宠物列表
      </Link>
      <h1 className="text-xl font-bold mb-4">添加新宠物</h1>
      <PetForm />
    </div>
  )
}