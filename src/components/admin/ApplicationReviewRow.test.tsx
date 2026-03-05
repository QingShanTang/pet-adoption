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