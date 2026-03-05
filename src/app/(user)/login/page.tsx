import LoginForm from '@/components/auth/LoginForm'
import Link from 'next/link'
import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto mt-16 bg-white rounded-xl shadow p-6">
      <h1 className="text-xl font-bold text-center mb-6">登录</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="text-center text-sm text-gray-500 mt-4">
        还没有账号？{' '}
        <Link href="/register" className="text-orange-500 hover:underline">注册</Link>
      </p>
    </div>
  )
}