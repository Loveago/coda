/**
 * Membership is free — registration fees, annual dues and application fees
 * were retired when Mr Truth Agency became a full-service agency. This module
 * is kept only for the shared currency formatter used across the site
 * (vehicle prices, product prices and historical payment receipts).
 */
export function formatGhs(pesewas: number) {
  return `GHS ${(pesewas / 100).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
