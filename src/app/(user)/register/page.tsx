import RegisterForm from '@/components/auth/RegisterForm'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="max-w-sm mx-auto mt-16 bg-white rounded-xl shadow p-6">
      <h1 className="text-xl font-bold text-center mb-6">注册</h1>
      <RegisterForm />
      <p className="text-center text-sm text-gray-500 mt-4">
        已有账号？{' '}
        <Link href="/login" className="text-orange-500 hover:underline">登录</Link>
      </p>
    </div>
  )
}