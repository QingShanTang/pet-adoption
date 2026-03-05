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
