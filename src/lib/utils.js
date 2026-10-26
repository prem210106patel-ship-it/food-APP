export const slugify = (text) => {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const generateToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const hashToken = async (token) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const generateOrderNumber = () => {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const random = Math.floor(100000 + Math.random() * 900000);
  return `FH${ymd}${random}`;
};

export const ORDER_STATUSES = {
  pending: { label: 'Pending', color: 'amber' },
  confirmed: { label: 'Confirmed', color: 'blue' },
  preparing: { label: 'Preparing', color: 'orange' },
  ready: { label: 'Ready for Pickup', color: 'teal' },
  out_for_delivery: { label: 'Out for Delivery', color: 'indigo' },
  delivered: { label: 'Delivered', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
  rejected: { label: 'Rejected', color: 'red' },
};

export const PAYMENT_STATUSES = {
  unpaid: { label: 'Unpaid', color: 'ink' },
  pending: { label: 'Pending', color: 'amber' },
  paid: { label: 'Paid', color: 'green' },
  failed: { label: 'Failed', color: 'red' },
  refunded: { label: 'Refunded', color: 'purple' },
};

export const PAYMENT_METHODS = {
  cod: 'Cash on Delivery',
  upi_qr: 'UPI QR Payment',
  online: 'Online Payment',
};

export const DIETARY_LABELS = {
  vegetarian: { label: 'Veg', color: 'green' },
  non_vegetarian: { label: 'Non-Veg', color: 'red' },
  vegan: { label: 'Vegan', color: 'emerald' },
  egg: { label: 'Contains Egg', color: 'yellow' },
  jain: { label: 'Jain', color: 'teal' },
};

export const CUISINES = [
  'Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Continental',
  'South Indian', 'Mughlai', 'Bengali', 'Punjabi', 'Fast Food',
  'Desserts', 'Beverages', 'Healthy', 'Japanese', 'Korean',
];

export const calculateDiscount = (coupon, subtotal) => {
  if (!coupon) return 0;
  if (subtotal < (coupon.minimum_order_amount || 0)) return 0;
  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = Math.floor((subtotal * coupon.discount_value) / 100);
    if (coupon.maximum_discount > 0) {
      discount = Math.min(discount, coupon.maximum_discount);
    }
  } else {
    discount = coupon.discount_value;
  }
  return Math.min(discount, subtotal);
};
