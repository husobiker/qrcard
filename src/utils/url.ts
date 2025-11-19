/**
 * Get the public base URL for the application
 * Uses VITE_PUBLIC_URL if set, otherwise falls back to window.location.origin
 */
export function getBaseUrl(): string {
  // In production, use the environment variable
  if (import.meta.env.VITE_PUBLIC_URL) {
    // Trim whitespace and remove trailing slashes
    return import.meta.env.VITE_PUBLIC_URL.trim().replace(/\/+$/, '');
  }

  // In development, use current origin
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Fallback (shouldn't happen in browser)
  return "https://qrcard.gozcu.tech";
}

/**
 * Get public URL for an employee profile
 */
export function getEmployeePublicUrl(
  companyId: string,
  employeeId: string
): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/${companyId}/${employeeId}`;
}
