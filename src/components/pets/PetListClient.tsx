'use client'

import { useState } from 'react'
import PetCard from './PetCard'
import PetFilters from './PetFilters'
import type { Pet } from '@/types'

export default function PetListClient({ initialPets }: { initialPets: Pet[] }) {
  const [filters, setFilters] = useState({ search: '', species: '', gender: '' })

  const filtered = initialPets.filter(pet => {
    if (filters.search && !pet.name.includes(filters.search)) return false
    if (filters.species && pet.species !== filters.species) return false
    if (filters.gender && pet.gender !== filters.gender) return false
    return true
  })

  return (
    <>
      <PetFilters onFilterChange={setFilters} />
      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 mt-12">没有找到符合条件的宠物</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(pet => <PetCard key={pet.id} pet={pet} />)}
        </div>
      )}
    </>
  )
}