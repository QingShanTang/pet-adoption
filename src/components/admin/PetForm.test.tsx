import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    const user = userEvent.setup()
    render(<PetForm />)
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByText(/请填写宠物名称/)).toBeInTheDocument()
  })
})