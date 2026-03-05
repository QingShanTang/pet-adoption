# Pet Adoption App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a mobile-first pet adoption web app where users browse and apply to adopt pets, and admins manage pets and review applications.

**Architecture:** Single Next.js (App Router) app with two route groups — `(user)` for the public-facing UI and `(admin)` for the protected management panel. Supabase handles PostgreSQL, auth, and image storage. Deployed to Vercel.

**Tech Stack:** Next.js 14 (App Router), Supabase (Auth + PostgreSQL + Storage), Tailwind CSS, TypeScript, Jest + React Testing Library

---

## Prerequisites

Before starting, you need:
1. A [Supabase](https://supabase.com) project created (free tier is fine)
2. Node.js 18+ installed
3. A [Vercel](https://vercel.com) account (for final deployment, not needed during development)

---

## Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts` (auto-generated)
- Create: `.env.local`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/types/index.ts`

### Step 1: Scaffold the project

Run in the project root (`/Users/kun/local/snapshots/260505/test-demo`):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

When prompted, accept all defaults. The `.` means install in the current directory.

### Step 2: Install Supabase and testing dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest
```

### Step 3: Configure Jest

Create `jest.config.ts`:

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default createJestConfig(config)
```

Create `jest.setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

### Step 4: Create environment file

Create `.env.local` (replace with your actual Supabase values from the Supabase dashboard → Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Add `.env.local` to `.gitignore` (it should already be there from create-next-app).

### Step 5: Create shared type definitions

Create `src/types/index.ts`:

```typescript
export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  name: string | null
  phone: string | null
  role: UserRole
}

export type PetSpecies = 'cat' | 'dog' | 'other'
export type PetGender = 'male' | 'female'
export type PetStatus = 'available' | 'pending' | 'adopted'

export interface Pet {
  id: string
  name: string
  species: PetSpecies
  breed: string | null
  age: number | null
  gender: PetGender
  description: string | null
  status: PetStatus
  image_url: string | null
  created_at: string
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface Application {
  id: string
  user_id: string
  pet_id: string
  status: ApplicationStatus
  message: string | null
  created_at: string
  pet?: Pet
  profile?: Profile
}
```

### Step 6: Create Supabase client helpers

Create `src/lib/supabase/client.ts` (for use in browser/client components):

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `src/lib/supabase/server.ts` (for use in Server Components and API routes):

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

### Step 7: Verify the project runs

```bash
npm run dev
```

Expected: Server starts at `http://localhost:3000`. Open browser, see the default Next.js welcome page.

### Step 8: Commit

```bash
git add -A
git commit -m "feat: initialize Next.js project with Supabase and testing setup"
```

---

## Task 2: Database Schema Setup

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

All of this runs in the Supabase SQL Editor (Dashboard → SQL Editor → New query).

### Step 1: Create profiles table and auto-create on signup

```sql
-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now()
);

-- Auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### Step 2: Create pets table

```sql
create table public.pets (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  species text not null check (species in ('cat', 'dog', 'other')),
  breed text,
  age int check (age >= 0),
  gender text not null check (gender in ('male', 'female')),
  description text,
  status text not null default 'available' check (status in ('available', 'pending', 'adopted')),
  image_url text,
  created_at timestamptz default now()
);
```

### Step 3: Create applications table

```sql
create table public.applications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  pet_id uuid references public.pets(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  message text,
  created_at timestamptz default now(),
  unique(user_id, pet_id)
);
```

### Step 4: Enable Row Level Security

```sql
alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.applications enable row level security;

-- Profiles: users can read and update their own profile
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Pets: anyone can read available pets; only admins can write
create policy "Anyone can view pets"
  on public.pets for select using (true);
create policy "Admins can insert pets"
  on public.pets for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can update pets"
  on public.pets for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can delete pets"
  on public.pets for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Applications: users can view and create their own; admins can view and update all
create policy "Users can view own applications"
  on public.applications for select
  using (auth.uid() = user_id or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));
create policy "Users can create applications"
  on public.applications for insert
  with check (auth.uid() = user_id);
create policy "Admins can update applications"
  on public.applications for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
```

### Step 5: Set up Storage bucket for pet images

In Supabase Dashboard → Storage → New bucket:
- Name: `pet-images`
- Public bucket: **yes**

Then run in SQL Editor:

```sql
-- Allow admins to upload pet images
create policy "Admins can upload pet images"
  on storage.objects for insert
  with check (
    bucket_id = 'pet-images' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Anyone can view pet images (bucket is public)
create policy "Anyone can view pet images"
  on storage.objects for select
  using (bucket_id = 'pet-images');
```

### Step 6: Insert seed data for testing

```sql
insert into public.pets (name, species, breed, age, gender, description, status) values
  ('小橘', 'cat', '橘猫', 24, 'male', '活泼好动，喜欢玩玩具，已绝育', 'available'),
  ('豆豆', 'dog', '柴犬', 12, 'female', '温顺亲人，适合有孩子的家庭', 'available'),
  ('雪球', 'cat', '布偶猫', 36, 'female', '性格安静，喜欢被抱', 'available');
```

### Step 7: Save migration file

Create `supabase/migrations/001_initial_schema.sql` and paste all the SQL from steps 1–5 (not the seed data). This is for documentation/reference.

### Step 8: Commit

```bash
git add supabase/
git commit -m "feat: add database schema and RLS policies"
```

---

## Task 3: Auth Middleware and Layout

**Files:**
- Create: `src/middleware.ts`
- Create: `src/app/layout.tsx` (replace default)
- Create: `src/app/(user)/layout.tsx`
- Create: `src/app/(admin)/layout.tsx`

### Step 1: Write test for middleware role check

Create `src/middleware.test.ts`:

```typescript
// Note: middleware is hard to unit test directly.
// We test the helper that checks admin role.
import { isAdminPath, isProtectedPath } from '@/lib/auth-helpers'

describe('auth path helpers', () => {
  it('identifies admin paths', () => {
    expect(isAdminPath('/admin/pets')).toBe(true)
    expect(isAdminPath('/admin')).toBe(true)
    expect(isAdminPath('/pets')).toBe(false)
  })

  it('identifies protected paths', () => {
    expect(isProtectedPath('/my/applications')).toBe(true)
    expect(isProtectedPath('/adopt/123')).toBe(true)
    expect(isProtectedPath('/')).toBe(false)
  })
})
```

Run: `npx jest src/middleware.test.ts`
Expected: FAIL (module not found)

### Step 2: Create auth helpers

Create `src/lib/auth-helpers.ts`:

```typescript
export function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin')
}

export function isProtectedPath(pathname: string): boolean {
  return pathname.startsWith('/my/') || pathname.startsWith('/adopt/')
}
```

Run: `npx jest src/middleware.test.ts`
Expected: PASS

### Step 3: Create middleware

Create `src/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdminPath, isProtectedPath } from '@/lib/auth-helpers'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users away from protected routes
  if (!user && (isProtectedPath(pathname) || isAdminPath(pathname))) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check admin role for admin routes
  if (user && isAdminPath(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

### Step 4: Update root layout

Replace `src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '宠物领养',
  description: '为每一只小动物找到温暖的家',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

### Step 5: Create route group layouts

Create `src/app/(user)/layout.tsx`:

```typescript
import Link from 'next/link'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-orange-500">
            🐾 宠物领养
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/my/applications" className="text-gray-600 hover:text-orange-500">
              我的申请
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-orange-500">
              登录
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
```

Create `src/app/(admin)/layout.tsx`:

```typescript
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
          <span className="font-bold text-gray-800">管理后台</span>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin/pets" className="text-blue-600 hover:underline">宠物管理</Link>
            <Link href="/admin/applications" className="text-blue-600 hover:underline">申请审核</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
```

### Step 6: Run all tests

```bash
npx jest
```

Expected: All tests pass.

### Step 7: Commit

```bash
git add -A
git commit -m "feat: add auth middleware and app layouts"
```

---

## Task 4: Login and Register Pages

**Files:**
- Create: `src/app/(user)/login/page.tsx`
- Create: `src/app/(user)/register/page.tsx`
- Create: `src/components/auth/LoginForm.tsx`
- Create: `src/components/auth/RegisterForm.tsx`
- Test: `src/components/auth/LoginForm.test.tsx`
- Test: `src/components/auth/RegisterForm.test.tsx`

### Step 1: Write failing test for LoginForm

Create `src/components/auth/LoginForm.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from './LoginForm'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
    },
  }),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => ({ get: () => null }),
}))

describe('LoginForm', () => {
  it('renders email and password fields', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument()
    expect(screen.getByLabelText('密码')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument()
  })

  it('shows error when fields are empty and form is submitted', async () => {
    render(<LoginForm />)
    await userEvent.click(screen.getByRole('button', { name: '登录' }))
    expect(screen.getByText(/请填写邮箱和密码/i)).toBeInTheDocument()
  })
})
```

Run: `npx jest LoginForm.test.tsx`
Expected: FAIL (module not found)

### Step 2: Create LoginForm component

Create `src/components/auth/LoginForm.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setError('请填写邮箱和密码')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('邮箱或密码错误')
      setLoading(false)
      return
    }
    router.push(searchParams.get('redirectTo') || '/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
        <input
          id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">密码</label>
        <input
          id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit" disabled={loading}
        className="w-full bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? '登录中...' : '登录'}
      </button>
    </form>
  )
}
```

Run: `npx jest LoginForm.test.tsx`
Expected: PASS

### Step 3: Write and pass RegisterForm test

Create `src/components/auth/RegisterForm.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import RegisterForm from './RegisterForm'

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signUp: jest.fn().mockResolvedValue({ error: null }),
    },
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}))

describe('RegisterForm', () => {
  it('renders name, email and password fields', () => {
    render(<RegisterForm />)
    expect(screen.getByLabelText('姓名')).toBeInTheDocument()
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument()
    expect(screen.getByLabelText('密码')).toBeInTheDocument()
  })
})
```

Create `src/components/auth/RegisterForm.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email || !password) {
      setError('请填写所有字段')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
        <input
          id="name" type="text" value={name} onChange={e => setName(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
        <input
          id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">密码</label>
        <input
          id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit" disabled={loading}
        className="w-full bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? '注册中...' : '注册'}
      </button>
    </form>
  )
}
```

Run: `npx jest src/components/auth/`
Expected: PASS (2 test suites)

### Step 4: Create page routes

Create `src/app/(user)/login/page.tsx`:

```typescript
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
```

Create `src/app/(user)/register/page.tsx`:

```typescript
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
```

### Step 5: Run all tests

```bash
npx jest
```

Expected: All tests pass.

### Step 6: Commit

```bash
git add -A
git commit -m "feat: add login and register pages"
```

---

## Task 5: Pet Listing Page (Home)

**Files:**
- Create: `src/app/(user)/page.tsx`
- Create: `src/components/pets/PetCard.tsx`
- Create: `src/components/pets/PetFilters.tsx`
- Test: `src/components/pets/PetCard.test.tsx`
- Test: `src/components/pets/PetFilters.test.tsx`

### Step 1: Write failing test for PetCard

Create `src/components/pets/PetCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import PetCard from './PetCard'
import type { Pet } from '@/types'

const mockPet: Pet = {
  id: '1',
  name: '小橘',
  species: 'cat',
  breed: '橘猫',
  age: 24,
  gender: 'male',
  description: '活泼好动',
  status: 'available',
  image_url: null,
  created_at: '2024-01-01',
}

describe('PetCard', () => {
  it('displays pet name, species and age', () => {
    render(<PetCard pet={mockPet} />)
    expect(screen.getByText('小橘')).toBeInTheDocument()
    expect(screen.getByText(/橘猫/)).toBeInTheDocument()
    expect(screen.getByText(/2岁/)).toBeInTheDocument()
  })

  it('shows gender label', () => {
    render(<PetCard pet={mockPet} />)
    expect(screen.getByText('公')).toBeInTheDocument()
  })

  it('links to pet detail page', () => {
    render(<PetCard pet={mockPet} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/pets/1')
  })
})
```

Run: `npx jest PetCard.test.tsx`
Expected: FAIL

### Step 2: Create PetCard component

Create `src/components/pets/PetCard.tsx`:

```typescript
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
```

Run: `npx jest PetCard.test.tsx`
Expected: PASS

### Step 3: Write and pass PetFilters test

Create `src/components/pets/PetFilters.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PetFilters from './PetFilters'

describe('PetFilters', () => {
  it('renders search input and filter dropdowns', () => {
    render(<PetFilters onFilterChange={jest.fn()} />)
    expect(screen.getByPlaceholderText(/搜索/)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /物种/ })).toBeInTheDocument()
  })

  it('calls onFilterChange when search input changes', async () => {
    const onChange = jest.fn()
    render(<PetFilters onFilterChange={onChange} />)
    await userEvent.type(screen.getByPlaceholderText(/搜索/), '小橘')
    expect(onChange).toHaveBeenCalled()
  })
})
```

Create `src/components/pets/PetFilters.tsx`:

```typescript
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
```

Run: `npx jest PetFilters.test.tsx`
Expected: PASS

### Step 4: Create the home page (Server Component)

Create `src/app/(user)/page.tsx`:

```typescript
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
```

Create `src/components/pets/PetListClient.tsx`:

```typescript
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
```

### Step 5: Run all tests

```bash
npx jest
```

Expected: All tests pass.

### Step 6: Verify in browser

```bash
npm run dev
```

Open `http://localhost:3000`. You should see a 2-column pet grid with the seeded data.

### Step 7: Commit

```bash
git add -A
git commit -m "feat: add pet listing home page with search and filter"
```

---

## Task 6: Pet Detail Page

**Files:**
- Create: `src/app/(user)/pets/[id]/page.tsx`

### Step 1: Create the page (Server Component, no test needed for data fetching)

Create `src/app/(user)/pets/[id]/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

const SPECIES_LABEL = { cat: '猫', dog: '狗', other: '其他' }
const GENDER_LABEL = { male: '公', female: '母' }

function formatAge(months: number | null): string {
  if (months === null) return '年龄不详'
  if (months < 12) return `${months}个月`
  return `${Math.floor(months / 12)}岁`
}

export default async function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: pet } = await supabase.from('pets').select('*').eq('id', id).single()

  if (!pet) notFound()

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="aspect-square bg-gray-100 relative">
        {pet.image_url ? (
          <Image src={pet.image_url} alt={pet.name} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-8xl">
            {pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : '🐾'}
          </div>
        )}
      </div>
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-800">{pet.name}</h1>
        <div className="flex gap-2 mt-2 flex-wrap">
          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-sm">
            {SPECIES_LABEL[pet.species as keyof typeof SPECIES_LABEL]}
          </span>
          {pet.breed && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-sm">{pet.breed}</span>
          )}
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-sm">
            {formatAge(pet.age)}
          </span>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-sm">
            {GENDER_LABEL[pet.gender as keyof typeof GENDER_LABEL]}
          </span>
        </div>
        {pet.description && (
          <p className="mt-4 text-gray-600 leading-relaxed">{pet.description}</p>
        )}
        {pet.status === 'available' ? (
          <Link
            href={`/adopt/${pet.id}`}
            className="mt-6 block w-full bg-orange-500 text-white text-center py-3 rounded-xl font-semibold hover:bg-orange-600"
          >
            申请领养
          </Link>
        ) : (
          <div className="mt-6 w-full bg-gray-200 text-gray-500 text-center py-3 rounded-xl font-semibold">
            {pet.status === 'pending' ? '审核中，暂不可申请' : '已被领养'}
          </div>
        )}
      </div>
    </div>
  )
}
```

### Step 2: Verify in browser

Navigate to a pet card from the home page. You should see the detail page.

### Step 3: Commit

```bash
git add -A
git commit -m "feat: add pet detail page"
```

---

## Task 7: Adoption Application Form

**Files:**
- Create: `src/app/(user)/adopt/[id]/page.tsx`
- Create: `src/components/adopt/AdoptForm.tsx`
- Test: `src/components/adopt/AdoptForm.test.tsx`

### Step 1: Write failing test

Create `src/components/adopt/AdoptForm.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdoptForm from './AdoptForm'

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({ error: null }),
    }),
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

describe('AdoptForm', () => {
  it('renders message textarea and submit button', () => {
    render(<AdoptForm petId="pet-1" petName="小橘" />)
    expect(screen.getByLabelText(/申请说明/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '提交申请' })).toBeInTheDocument()
  })

  it('shows validation error when message is empty', async () => {
    render(<AdoptForm petId="pet-1" petName="小橘" />)
    await userEvent.click(screen.getByRole('button', { name: '提交申请' }))
    expect(screen.getByText(/请填写申请说明/)).toBeInTheDocument()
  })
})
```

Run: `npx jest AdoptForm.test.tsx`
Expected: FAIL

### Step 2: Create AdoptForm component

Create `src/components/adopt/AdoptForm.tsx`:

```typescript
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
```

Run: `npx jest AdoptForm.test.tsx`
Expected: PASS

### Step 3: Create adoption page

Create `src/app/(user)/adopt/[id]/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import AdoptForm from '@/components/adopt/AdoptForm'
import Link from 'next/link'

export default async function AdoptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirectTo=/adopt/${id}`)

  const { data: pet } = await supabase.from('pets').select('*').eq('id', id).single()
  if (!pet || pet.status !== 'available') notFound()

  return (
    <div>
      <Link href={`/pets/${id}`} className="text-sm text-orange-500 hover:underline mb-4 inline-block">
        ← 返回 {pet.name} 的详情
      </Link>
      <div className="bg-white rounded-xl shadow p-4">
        <h1 className="text-xl font-bold mb-1">申请领养 {pet.name}</h1>
        <p className="text-sm text-gray-500 mb-4">
          请认真填写申请说明，管理员会尽快审核
        </p>
        <AdoptForm petId={id} petName={pet.name} />
      </div>
    </div>
  )
}
```

### Step 4: Run all tests

```bash
npx jest
```

Expected: All tests pass.

### Step 5: Commit

```bash
git add -A
git commit -m "feat: add adoption application form"
```

---

## Task 8: My Applications Page

**Files:**
- Create: `src/app/(user)/my/applications/page.tsx`
- Create: `src/components/applications/ApplicationCard.tsx`
- Test: `src/components/applications/ApplicationCard.test.tsx`

### Step 1: Write failing test

Create `src/components/applications/ApplicationCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import ApplicationCard from './ApplicationCard'
import type { Application } from '@/types'

const mockApp: Application = {
  id: 'app-1',
  user_id: 'user-1',
  pet_id: 'pet-1',
  status: 'pending',
  message: '我很喜欢它',
  created_at: '2024-01-15T10:00:00Z',
  pet: {
    id: 'pet-1', name: '小橘', species: 'cat', breed: '橘猫',
    age: 24, gender: 'male', description: null, status: 'pending',
    image_url: null, created_at: '2024-01-01',
  },
}

describe('ApplicationCard', () => {
  it('shows pet name and application status', () => {
    render(<ApplicationCard application={mockApp} />)
    expect(screen.getByText('小橘')).toBeInTheDocument()
    expect(screen.getByText('审核中')).toBeInTheDocument()
  })

  it('shows approved status with green styling', () => {
    render(<ApplicationCard application={{ ...mockApp, status: 'approved' }} />)
    expect(screen.getByText('已通过')).toBeInTheDocument()
  })
})
```

Run: `npx jest ApplicationCard.test.tsx`
Expected: FAIL

### Step 2: Create ApplicationCard component

Create `src/components/applications/ApplicationCard.tsx`:

```typescript
import type { Application, ApplicationStatus } from '@/types'
import Link from 'next/link'

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; className: string }> = {
  pending:  { label: '审核中', className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '已通过', className: 'bg-green-100 text-green-700' },
  rejected: { label: '已拒绝', className: 'bg-red-100 text-red-700' },
}

export default function ApplicationCard({ application }: { application: Application }) {
  const { label, className } = STATUS_CONFIG[application.status]
  const pet = application.pet

  return (
    <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
      <div className="text-3xl">{pet?.species === 'cat' ? '🐱' : pet?.species === 'dog' ? '🐶' : '🐾'}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800">{pet?.name ?? '未知宠物'}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${className}`}>{label}</span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5 truncate">{application.message}</p>
      </div>
      {pet && (
        <Link href={`/pets/${application.pet_id}`} className="text-sm text-orange-500 hover:underline shrink-0">
          查看宠物
        </Link>
      )}
    </div>
  )
}
```

Run: `npx jest ApplicationCard.test.tsx`
Expected: PASS

### Step 3: Create the page

Create `src/app/(user)/my/applications/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ApplicationCard from '@/components/applications/ApplicationCard'

export default async function MyApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/my/applications')

  const { data: applications } = await supabase
    .from('applications')
    .select('*, pet:pets(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">我的申请</h1>
      {!applications?.length ? (
        <p className="text-center text-gray-500 mt-12">还没有领养申请</p>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      )}
    </div>
  )
}
```

### Step 4: Run all tests and commit

```bash
npx jest
git add -A
git commit -m "feat: add my applications page"
```

---

## Task 9: Admin – Pet Management (CRUD)

**Files:**
- Create: `src/app/(admin)/admin/pets/page.tsx`
- Create: `src/app/(admin)/admin/pets/new/page.tsx`
- Create: `src/components/admin/PetForm.tsx`
- Test: `src/components/admin/PetForm.test.tsx`

### Step 1: Write failing test for PetForm

Create `src/components/admin/PetForm.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import PetForm from './PetForm'

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'http://example.com/test.jpg' } }),
      }),
    },
  }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}))

describe('PetForm', () => {
  it('renders all required fields', () => {
    render(<PetForm />)
    expect(screen.getByLabelText('宠物名称')).toBeInTheDocument()
    expect(screen.getByLabelText('物种')).toBeInTheDocument()
    expect(screen.getByLabelText('性别')).toBeInTheDocument()
  })

  it('shows validation error when name is empty', async () => {
    const { getByRole, getByText } = render(<PetForm />)
    const { userEvent } = await import('@testing-library/user-event')
    const ue = userEvent.setup()
    await ue.click(getByRole('button', { name: '保存' }))
    expect(getByText(/请填写宠物名称/)).toBeInTheDocument()
  })
})
```

Run: `npx jest PetForm.test.tsx`
Expected: FAIL

### Step 2: Create PetForm component

Create `src/components/admin/PetForm.tsx`:

```typescript
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
```

Run: `npx jest PetForm.test.tsx`
Expected: PASS

### Step 3: Create admin pets list page

Create `src/app/(admin)/admin/pets/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DeletePetButton from '@/components/admin/DeletePetButton'

export default async function AdminPetsPage() {
  const supabase = await createClient()
  const { data: pets } = await supabase.from('pets').select('*').order('created_at', { ascending: false })

  const STATUS_LABEL = { available: '待领养', pending: '审核中', adopted: '已领养' }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">宠物管理</h1>
        <Link href="/admin/pets/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + 添加宠物
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">名称</th>
              <th className="text-left px-4 py-3">品种</th>
              <th className="text-left px-4 py-3">状态</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pets?.map(pet => (
              <tr key={pet.id}>
                <td className="px-4 py-3 font-medium">{pet.name}</td>
                <td className="px-4 py-3 text-gray-600">{pet.breed ?? pet.species}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                    {STATUS_LABEL[pet.status as keyof typeof STATUS_LABEL]}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <Link href={`/admin/pets/${pet.id}/edit`} className="text-blue-600 hover:underline mr-3">
                    编辑
                  </Link>
                  <DeletePetButton petId={pet.id} petName={pet.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

### Step 4: Create DeletePetButton (client component for confirmation)

Create `src/components/admin/DeletePetButton.tsx`:

```typescript
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
    <button onClick={handleDelete} className="text-red-500 hover:underline text-sm">
      删除
    </button>
  )
}
```

### Step 5: Create new pet and edit pet pages

Create `src/app/(admin)/admin/pets/new/page.tsx`:

```typescript
import PetForm from '@/components/admin/PetForm'

export default function NewPetPage() {
  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-4">添加宠物</h1>
      <PetForm />
    </div>
  )
}
```

Create `src/app/(admin)/admin/pets/[id]/edit/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PetForm from '@/components/admin/PetForm'

export default async function EditPetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: pet } = await supabase.from('pets').select('*').eq('id', id).single()
  if (!pet) notFound()

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-4">编辑宠物</h1>
      <PetForm pet={pet} />
    </div>
  )
}
```

### Step 6: Run all tests and commit

```bash
npx jest
git add -A
git commit -m "feat: add admin pet management CRUD"
```

---

## Task 10: Admin – Application Review

**Files:**
- Create: `src/app/(admin)/admin/applications/page.tsx`
- Create: `src/components/admin/ApplicationReviewRow.tsx`
- Test: `src/components/admin/ApplicationReviewRow.test.tsx`

### Step 1: Write failing test

Create `src/components/admin/ApplicationReviewRow.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import ApplicationReviewRow from './ApplicationReviewRow'
import type { Application } from '@/types'

const mockApp: Application = {
  id: 'app-1', user_id: 'user-1', pet_id: 'pet-1',
  status: 'pending', message: '我想领养它', created_at: '2024-01-15T10:00:00Z',
  pet: { id: 'pet-1', name: '小橘', species: 'cat', breed: '橘猫', age: 24,
    gender: 'male', description: null, status: 'pending', image_url: null, created_at: '2024-01-01' },
  profile: { id: 'user-1', name: '张三', phone: '13800000000', role: 'user' },
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
    }),
  }),
}))

jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }))

describe('ApplicationReviewRow', () => {
  it('shows applicant name, pet name and message', () => {
    render(<table><tbody><ApplicationReviewRow application={mockApp} /></tbody></table>)
    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText('小橘')).toBeInTheDocument()
    expect(screen.getByText('我想领养它')).toBeInTheDocument()
  })

  it('shows approve and reject buttons for pending applications', () => {
    render(<table><tbody><ApplicationReviewRow application={mockApp} /></tbody></table>)
    expect(screen.getByRole('button', { name: '通过' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '拒绝' })).toBeInTheDocument()
  })
})
```

Run: `npx jest ApplicationReviewRow.test.tsx`
Expected: FAIL

### Step 2: Create ApplicationReviewRow component

Create `src/components/admin/ApplicationReviewRow.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Application, ApplicationStatus } from '@/types'

export default function ApplicationReviewRow({ application }: { application: Application }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateStatus(status: ApplicationStatus) {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('applications').update({ status }).eq('id', application.id)

    // If approved, also set pet status to 'adopted'
    if (status === 'approved') {
      await supabase.from('pets').update({ status: 'adopted' }).eq('id', application.pet_id)
    }
    router.refresh()
  }

  return (
    <tr className="border-b">
      <td className="px-4 py-3">
        <div className="font-medium">{application.profile?.name ?? '未知'}</div>
        <div className="text-xs text-gray-500">{application.profile?.phone}</div>
      </td>
      <td className="px-4 py-3 font-medium">{application.pet?.name}</td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{application.message}</td>
      <td className="px-4 py-3 text-sm">
        {new Date(application.created_at).toLocaleDateString('zh-CN')}
      </td>
      <td className="px-4 py-3">
        {application.status === 'pending' ? (
          <div className="flex gap-2">
            <button onClick={() => updateStatus('approved')} disabled={loading}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50">
              通过
            </button>
            <button onClick={() => updateStatus('rejected')} disabled={loading}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50">
              拒绝
            </button>
          </div>
        ) : (
          <span className={`text-sm ${application.status === 'approved' ? 'text-green-600' : 'text-red-500'}`}>
            {application.status === 'approved' ? '已通过' : '已拒绝'}
          </span>
        )}
      </td>
    </tr>
  )
}
```

Run: `npx jest ApplicationReviewRow.test.tsx`
Expected: PASS

### Step 3: Create the admin applications page

Create `src/app/(admin)/admin/applications/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import ApplicationReviewRow from '@/components/admin/ApplicationReviewRow'

export default async function AdminApplicationsPage() {
  const supabase = await createClient()
  const { data: applications } = await supabase
    .from('applications')
    .select('*, pet:pets(*), profile:profiles(*)')
    .order('created_at', { ascending: false })

  const pending = applications?.filter(a => a.status === 'pending') ?? []
  const reviewed = applications?.filter(a => a.status !== 'pending') ?? []

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">领养申请审核</h1>
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 mb-2">待审核 ({pending.length})</h2>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">申请人</th>
                <th className="text-left px-4 py-3">宠物</th>
                <th className="text-left px-4 py-3">申请说明</th>
                <th className="text-left px-4 py-3">申请时间</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400">暂无待审核申请</td></tr>
              ) : pending.map(app => <ApplicationReviewRow key={app.id} application={app} />)}
            </tbody>
          </table>
        </div>
      </section>
      {reviewed.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 mb-2">已处理 ({reviewed.length})</h2>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3">申请人</th>
                  <th className="text-left px-4 py-3">宠物</th>
                  <th className="text-left px-4 py-3">申请说明</th>
                  <th className="text-left px-4 py-3">申请时间</th>
                  <th className="px-4 py-3">状态</th>
                </tr>
              </thead>
              <tbody>
                {reviewed.map(app => <ApplicationReviewRow key={app.id} application={app} />)}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
```

### Step 4: Run all tests

```bash
npx jest
```

Expected: All tests pass.

### Step 5: Commit

```bash
git add -A
git commit -m "feat: add admin application review"
```

---

## Task 11: Admin Redirect and Navigation Polish

**Files:**
- Create: `src/app/(admin)/admin/page.tsx`
- Modify: `src/app/(user)/layout.tsx` (add auth-aware nav)

### Step 1: Create admin index redirect

Create `src/app/(admin)/admin/page.tsx`:

```typescript
import { redirect } from 'next/navigation'

export default function AdminPage() {
  redirect('/admin/pets')
}
```

### Step 2: Make header navigation auth-aware

Replace `src/app/(user)/layout.tsx` with an async Server Component that shows the right links:

```typescript
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
```

Create `src/components/auth/LogoutButton.tsx`:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button onClick={handleLogout} className="text-gray-600 hover:text-orange-500">
      退出
    </button>
  )
}
```

### Step 3: Run all tests and commit

```bash
npx jest
git add -A
git commit -m "feat: add logout button and auth-aware navigation"
```

---

## Task 12: Deploy to Vercel

### Step 1: Create a GitHub repository

```bash
gh repo create pet-adoption --public --source=. --remote=origin --push
```

If you don't have the `gh` CLI, go to github.com, create a new repo, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/pet-adoption.git
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Framework Preset: Next.js (auto-detected)
4. Add environment variables (from your `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Click Deploy

### Step 3: Create admin user

After deployment, register a regular account, then go to Supabase Dashboard → Table Editor → profiles → find your user → set `role` to `admin`.

### Step 4: Verify the deployment

- Visit your Vercel URL
- Sign up as a user, browse pets, submit an adoption application
- Visit `/admin/pets` (you'll need to be logged in as admin)
- Add a pet, review the application

---

## Summary

| Task | Feature |
|------|---------|
| 1 | Project setup (Next.js + Supabase + Tailwind) |
| 2 | Database schema, RLS, storage |
| 3 | Auth middleware + layouts |
| 4 | Login / Register pages |
| 5 | Pet listing with search & filter |
| 6 | Pet detail page |
| 7 | Adoption application form |
| 8 | My applications page |
| 9 | Admin pet CRUD |
| 10 | Admin application review |
| 11 | Logout + auth-aware nav |
| 12 | Deploy to Vercel |
