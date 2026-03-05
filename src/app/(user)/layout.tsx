import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/auth/LogoutButton'

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-orange-500">🐾 宠物领养</Link>
          <nav className="flex items-center gap-4 text-sm">
            {user ? (
              <>
                <Link href="/my/applications" className="text-gray-600 hover:text-orange-500">我的申请</Link>
                <LogoutButton />
              </>
            ) : (
              <Link href="/login" className="text-gray-600 hover:text-orange-500">登录</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}