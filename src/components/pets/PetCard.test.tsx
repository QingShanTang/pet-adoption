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
    expect(screen.getByText(/公/)).toBeInTheDocument()
  })

  it('links to pet detail page', () => {
    render(<PetCard pet={mockPet} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/pets/1')
  })
})