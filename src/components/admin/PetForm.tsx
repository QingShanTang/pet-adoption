'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Pet } from '@/types'

interface PetFormProps {
  pet?: Pet
}

export default function PetForm({ pet }: PetFormProps) {
  const router = useRouter()
  const isEdit = !!pet

  const [name, setName] = useState(pet?.name ?? '')
  const [species, setSpecies] = useState(pet?.species ?? 'cat')
  const [breed, setBreed] = useState(pet?.breed ?? '')
  const [age, setAge] = useState(pet?.age?.toString() ?? '')
  const [gender, setGender] = useState(pet?.gender ?? 'male')
  const [description, setDescription] = useState(pet?.description ?? '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('请填写宠物名称'); return }
    setLoading(true)
    const supabase = createClient()

    let image_url = pet?.image_url ?? null
    if (imageFile) {
      const path = `${Date.now()}-${imageFile.name}`
      const { data, error: uploadError } = await supabase.storage
        .from('pet-images').upload(path, imageFile)
      if (uploadError) { setError('图片上传失败'); setLoading(false); return }
      image_url = supabase.storage.from('pet-images').getPublicUrl(data.path).data.publicUrl
    }

    const payload = {
      name: name.trim(), species, breed: breed || null,
      age: age ? parseInt(age) : null, gender, description: description || null, image_url,
    }

    const { error: dbError } = isEdit
      ? await supabase.from('pets').update(payload).eq('id', pet.id)
      : await supabase.from('pets').insert(payload)

    if (dbError) { setError('保存失败，请重试'); setLoading(false); return }
    router.push('/admin/pets')
    router.refresh()
  }

  const field = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl shadow p-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">宠物名称</label>
        <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className={field} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="species" className="block text-sm font-medium mb-1">物种</label>
          <select id="species" value={species} onChange={e => setSpecies(e.target.value as any)} className={field}>
            <option value="cat">猫</option>
            <option value="dog">狗</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium mb-1">性别</label>
          <select id="gender" value={gender} onChange={e => setGender(e.target.value as any)} className={field}>
            <option value="male">公</option>
            <option value="female">母</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="breed" className="block text-sm font-medium mb-1">品种</label>
          <input id="breed" type="text" value={breed} onChange={e => setBreed(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="age" className="block text-sm font-medium mb-1">年龄（月）</label>
          <input id="age" type="number" min="0" value={age} onChange={e => setAge(e.target.value)} className={field} />
        </div>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">描述</label>
        <textarea id="description" rows={3} value={description} onChange={e => setDescription(e.target.value)} className={`${field} resize-none`} />
      </div>
      <div>
        <label htmlFor="image" className="block text-sm font-medium mb-1">照片</label>
        <input id="image" type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)}
          className="text-sm text-gray-600" />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
        {loading ? '保存中...' : '保存'}
      </button>
    </form>
  )
}