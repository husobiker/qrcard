/**
 * Get the public base URL for the application
 */
export function getBaseUrl(): string {
  // For mobile, use the web URL from environment or hardcoded
  return 'https://qrcard.gozcu.tech';
}

/**
 * Get public URL for an employee profile
 */
export function getEmployeePublicUrl(companyId: string, employeeId: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/${companyId}/${employeeId}`;
}
