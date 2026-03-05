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