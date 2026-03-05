/**
 * Authentication path helpers for middleware routing
 */

const ADMIN_PATHS = ['/admin']
const PROTECTED_PATHS = ['/my', '/adopt']

/**
 * Check if a path requires admin authentication
 */
export function isAdminPath(path: string): boolean {
  return ADMIN_PATHS.some((adminPath) => path.startsWith(adminPath))
}

/**
 * Check if a path requires user authentication
 */
export function isProtectedPath(path: string): boolean {
  return PROTECTED_PATHS.some((protectedPath) => path.startsWith(protectedPath))
}