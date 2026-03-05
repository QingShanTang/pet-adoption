import Link from 'next/link'
import Image from 'next/image'
import type { Pet } from '@/types'

const SPECIES_LABEL = { cat: '猫', dog: '狗', other: '其他' }
const GENDER_LABEL = { male: '公', female: '母' }

function formatAge(months: number | null): string {
  if (months === null) return '年龄不详'
  if (months < 12) return `${months}个月`
  return `${Math.floor(months / 12)}岁`
}

export default function PetCard({ pet }: { pet: Pet }) {
  return (
    <Link href={`/pets/${pet.id}`} className="block bg-white rounded-xl shadow hover:shadow-md transition-shadow overflow-hidden">
      <div className="aspect-square bg-gray-100 relative">
        {pet.image_url ? (
          <Image src={pet.image_url} alt={pet.name} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-5xl">
            {pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : '🐾'}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-800">{pet.name}</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {pet.breed || SPECIES_LABEL[pet.species]} · {formatAge(pet.age)} · {GENDER_LABEL[pet.gender]}
        </p>
      </div>
    </Link>
  )
}