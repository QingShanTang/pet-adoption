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