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