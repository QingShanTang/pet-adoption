'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AdoptFormProps {
  petId: string
  petName: string
}

export default function AdoptForm({ petId, petName }: AdoptFormProps) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) {
      setError('请填写申请说明')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('applications').insert({
      pet_id: petId,
      user_id: user!.id,
      message: message.trim(),
    })

    if (error) {
      setError(error.code === '23505' ? '你已经申请过这只宠物了' : '提交失败，请重试')
      setLoading(false)
      return
    }

    router.push('/my/applications')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          申请说明
        </label>
        <textarea
          id="message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={5}
          placeholder={`请介绍一下你的居住环境、养宠经验，以及为什么想领养${petName}...`}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit" disabled={loading}
        className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? '提交中...' : '提交申请'}
      </button>
    </form>
  )
}