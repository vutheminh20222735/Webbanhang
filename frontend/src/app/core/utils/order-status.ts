export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPING',
  'DELIVERED',
  'CANCELLED',
  'RETURNED'
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

const ALIASES: Record<string, OrderStatus> = {
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

const LABELS: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPING: 'Đang vận chuyển',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Trả hàng'
};

const COLORS: Record<OrderStatus, string> = {
  PENDING: '#fbbf24',
  CONFIRMED: '#3b82f6',
  PROCESSING: '#8b5cf6',
  SHIPPING: '#0ea5e9',
  DELIVERED: '#059669',
  CANCELLED: '#ef4444',
  RETURNED: '#f97316'
};

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'SHIPPING', 'CANCELLED'],
  PROCESSING: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: []
};

const TIMELINE: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED'];

export function canonicalOrderStatus(raw?: string | null): OrderStatus {
  if (!raw) return 'PENDING';
  const alias = ALIASES[String(raw).toLowerCase()];
  if (alias) return alias;
  const upper = String(raw).toUpperCase() as OrderStatus;
  return (ORDER_STATUSES as readonly string[]).includes(upper) ? upper : 'PENDING';
}

export function orderStatusLabel(raw?: string | null): string {
  return LABELS[canonicalOrderStatus(raw)];
}

export function orderStatusColor(raw?: string | null): string {
  return COLORS[canonicalOrderStatus(raw)];
}

export function orderStatusClass(raw?: string | null): string {
  return canonicalOrderStatus(raw).toLowerCase();
}

export function nextOrderStatuses(raw?: string | null): OrderStatus[] {
  return TRANSITIONS[canonicalOrderStatus(raw)] || [];
}

export function orderTimeline(raw?: string | null): { key: OrderStatus; label: string; done: boolean; current: boolean }[] {
  const current = canonicalOrderStatus(raw);
  if (current === 'CANCELLED' || current === 'RETURNED') {
    return [{ key: current, label: LABELS[current], done: true, current: true }];
  }
  const idx = TIMELINE.indexOf(current);
  return TIMELINE.map((key, i) => ({
    key,
    label: LABELS[key],
    done: i <= idx,
    current: i === idx
  }));
}
