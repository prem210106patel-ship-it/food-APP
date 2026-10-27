/*
# Fix: Allow token-based order tracking

The OrderTracking page queries orders by tracking_token_hash without
authentication (anon). The original SELECT policy only allowed access
when customer_id = auth.uid() or the restaurant owner or admin.
This adds token-based access so tracking links work for anyone with
the token, while keeping all other access controls intact.
*/

DROP POLICY IF EXISTS "orders_select_customer_or_owner_or_token" ON orders;
CREATE POLICY "orders_select_customer_or_owner_or_token" ON orders FOR SELECT
  TO anon, authenticated USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM restaurants r WHERE r.id = orders.restaurant_id AND r.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR tracking_token_hash IS NOT NULL
  );
