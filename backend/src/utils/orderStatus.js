const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPING',
  'DELIVERED',
  'CANCELLED',
  'RETURNED'
];

const ALIASES = {
  pending: 'PENDING',
  confirmed: 'CONFIRMED',
  preparing: 'PROCESSING',
  processing: 'PROCESSING',
  shipping: 'SHIPPING',
  delivered: 'DELIVERED',
  canceled: 'CANCELLED',
  cancelled: 'CANCELLED',
  returned: 'RETURNED'
};

function canonicalOrderStatus(raw) {
  if (raw == null || raw === '') return null;
  const alias = ALIASES[String(raw).toLowerCase()];
  if (alias) return alias;
  const upper = String(raw).toUpperCase();
  return ORDER_STATUSES.includes(upper) ? upper : null;
}

module.exports = { ORDER_STATUSES, canonicalOrderStatus };
