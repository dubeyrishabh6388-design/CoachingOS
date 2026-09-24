/**
 * Anti-Poaching Contact Masking Vault
 * Prevents faculty and staff from exporting or viewing full parent/student mobile numbers
 * to protect the institute against batch hijacking and private tuition poaching.
 */

export function maskPhoneNumber(phone?: string | null, userRole?: string): string {
  if (!phone) return '—';
  
  // High-privilege roles can see full number
  const privilegedRoles = ['OWNER', 'DIRECTOR', 'SUPER_ADMIN', 'BRANCH_ADMIN'];
  if (userRole && privilegedRoles.includes(userRole.toUpperCase())) {
    return phone;
  }

  // Clean phone string
  const clean = phone.trim();
  if (clean.length < 7) return '••••••';

  // Show first 5 digits, mask last 5 digits
  const visiblePart = clean.slice(0, Math.min(5, clean.length - 4));
  return `${visiblePart} •••••`;
}

/**
 * Format Indian Currency Rupees
 */
export function formatIndianRupees(paiseOrRupees: number, isPaise: boolean = true): string {
  const rupees = isPaise ? Math.round(paiseOrRupees / 100) : Math.round(paiseOrRupees);
  return `₹${rupees.toLocaleString('en-IN')}`;
}
