/*
# Add UPI VPA to restaurants for UPI QR payments

Stores the merchant UPI ID (Virtual Payment Address) per restaurant
so the payment QR can be generated with correct merchant details.
Backwards compatible: defaults to null (UPI not configured).
*/
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS upi_vpa text;
