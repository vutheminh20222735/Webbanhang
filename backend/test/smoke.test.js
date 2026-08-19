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
