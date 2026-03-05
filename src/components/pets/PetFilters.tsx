'use client'

import { useState } from 'react'
import type { PetSpecies } from '@/types'

interface Filters {
  search: string
  species: PetSpecies | ''
  gender: 'male' | 'female' | ''
}

interface PetFiltersProps {
  onFilterChange: (filters: Filters) => void
}

export default function PetFilters({ onFilterChange }: PetFiltersProps) {
  const [filters, setFilters] = useState<Filters>({ search: '', species: '', gender: '' })

  function update(partial: Partial<Filters>) {
    const next = { ...filters, ...partial }
    setFilters(next)
    onFilterChange(next)
  }

  return (
    <div className="flex flex-col gap-2 mb-4">
      <input
        type="text"
        placeholder="搜索宠物名称..."
        value={filters.search}
        onChange={e => update({ search: e.target.value })}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <div className="flex gap-2">
        <select
          aria-label="物种"
          value={filters.species}
          onChange={e => update({ species: e.target.value as PetSpecies | '' })}
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="">全部物种</option>
          <option value="cat">猫</option>
          <option value="dog">狗</option>
          <option value="other">其他</option>
        </select>
        <select
          aria-label="性别"
          value={filters.gender}
          onChange={e => update({ gender: e.target.value as 'male' | 'female' | '' })}
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="">全部性别</option>
          <option value="male">公</option>
          <option value="female">母</option>
        </select>
      </div>
    </div>
  )
}