import { createClient } from '@/lib/supabase/server'
import PetCard from '@/components/pets/PetCard'
import PetListClient from '@/components/pets/PetListClient'
import type { Pet } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: pets } = await supabase
    .from('pets')
    .select('*')
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">待领养的小可爱们</h1>
        <p className="text-sm text-gray-500 mt-1">共 {pets?.length ?? 0} 只</p>
      </div>
      <PetListClient initialPets={pets ?? []} />
    </div>
  )
}