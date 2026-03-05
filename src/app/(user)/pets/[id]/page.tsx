import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

const SPECIES_LABEL = { cat: '猫', dog: '狗', other: '其他' }
const GENDER_LABEL = { male: '公', female: '母' }

function formatAge(months: number | null): string {
  if (months === null) return '年龄不详'
  if (months < 12) return `${months}个月`
  return `${Math.floor(months / 12)}岁`
}

export default async function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: pet } = await supabase.from('pets').select('*').eq('id', id).single()

  if (!pet) notFound()

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="aspect-square bg-gray-100 relative">
        {pet.image_url ? (
          <Image src={pet.image_url} alt={pet.name} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-8xl">
            {pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : '🐾'}
          </div>
        )}
      </div>
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-800">{pet.name}</h1>
        <div className="flex gap-2 mt-2 flex-wrap">
          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-sm">
            {SPECIES_LABEL[pet.species as keyof typeof SPECIES_LABEL]}
          </span>
          {pet.breed && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-sm">{pet.breed}</span>
          )}
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-sm">
            {formatAge(pet.age)}
          </span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-sm">
            {GENDER_LABEL[pet.gender as keyof typeof GENDER_LABEL]}
          </span>
        </div>
        {pet.description && (
          <p className="mt-4 text-gray-600 leading-relaxed">{pet.description}</p>
        )}
        {pet.status === 'available' ? (
          <Link
            href={`/adopt/${pet.id}`}
            className="mt-6 block w-full bg-orange-500 text-white text-center py-3 rounded-xl font-semibold hover:bg-orange-600"
          >
            申请领养
          </Link>
        ) : (
          <div className="mt-6 w-full bg-gray-200 text-gray-500 text-center py-3 rounded-xl font-semibold">
            {pet.status === 'pending' ? '审核中，暂不可申请' : '已被领养'}
          </div>
        )}
      </div>
    </div>
  )
}