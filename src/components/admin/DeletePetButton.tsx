'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeletePetButton({ petId, petName }: { petId: string; petName: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`确定要删除 ${petName} 吗？`)) return
    const supabase = createClient()
    await supabase.from('pets').delete().eq('id', petId)
    router.refresh()
  }

  return (
    <button onClick={handleDelete} className="text-red-600 hover:underline">
      删除
    </button>
  )
}