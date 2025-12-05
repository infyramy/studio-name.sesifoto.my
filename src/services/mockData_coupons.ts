// ============================================================================
// MOCK COUPONS
// ============================================================================
// Discount coupons
export const mockCoupons: Coupon[] = [
  {
    id: 'coupon-001',
    code: 'RAYA2026',
    type: 'percentage',
    value: 10,
    valid_from: '2025-01-01',
    valid_until: '2026-04-01',
    usage_limit: 100,
    usage_count: 5,
    min_spend: 150,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'coupon-002',
    code: 'EARLYBIRD',
    type: 'fixed',
    value: 20,
    valid_from: '2025-01-01',
    valid_until: '2026-02-15',
    usage_limit: 50,
    usage_count: 10,
    min_spend: 100,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'coupon-003',
    code: 'VIPRAYA',
    type: 'percentage',
    value: 20,
    valid_from: '2025-01-01',
    valid_until: '2026-04-01',
    usage_limit: 10,
    usage_count: 2,
    min_spend: 300,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
  },
];

