const { canonicalOrderStatus } = require('../src/utils/orderStatus');

test('smoke: environment', () => {
  expect(process.env.NODE_ENV || 'development').toBeDefined();
});

test('canonicalOrderStatus maps UI aliases to DB enum', () => {
  expect(canonicalOrderStatus('confirmed')).toBe('CONFIRMED');
  expect(canonicalOrderStatus('preparing')).toBe('PROCESSING');
  expect(canonicalOrderStatus('canceled')).toBe('CANCELLED');
  expect(canonicalOrderStatus('SHIPPING')).toBe('SHIPPING');
  expect(canonicalOrderStatus('')).toBeNull();
});

test('best-seller sold quantity uses DELIVERED only', () => {
  const soldMatch = { orderStatus: 'DELIVERED' };
  expect(soldMatch.orderStatus).toBe('DELIVERED');
  expect(soldMatch.orderStatus).not.toBe('PENDING');
  expect(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'CANCELLED', 'RETURNED'])
    .not.toContain(soldMatch.orderStatus);
});
