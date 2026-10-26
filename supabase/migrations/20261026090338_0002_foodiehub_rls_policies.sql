/*
# FoodieHub RLS Policies and Grants

Sets up row-level security policies and grants for all FoodieHub tables.

## Access model
- Public (anon): read approved restaurants, foods, categories, approved reviews, active coupons, tables
- Authenticated customers: CRUD own data (addresses, favorites, own orders, reviews)
- Restaurant owners: CRUD on own restaurants, their foods/categories/tables, read/update orders for their restaurants
- Admins: full access via role check in policies

## Grants
- anon: SELECT on public-readable tables; INSERT on orders, order_items, order_status_history, payments, coupon_redemptions (order creation flow)
- authenticated: CRUD on own-scoped tables
*/

-- ====== GRANTS ======
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

GRANT SELECT ON restaurants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON restaurants TO authenticated;

GRANT SELECT ON food_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON food_categories TO authenticated;

GRANT SELECT ON foods TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON foods TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON addresses TO authenticated;

GRANT SELECT ON restaurant_tables TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON restaurant_tables TO authenticated;

GRANT SELECT, INSERT, UPDATE ON orders TO anon, authenticated;

GRANT SELECT ON order_items TO anon, authenticated;
GRANT INSERT ON order_items TO anon, authenticated;

GRANT SELECT ON order_status_history TO anon, authenticated;
GRANT INSERT ON order_status_history TO anon, authenticated;

GRANT SELECT ON payments TO anon, authenticated;
GRANT INSERT ON payments TO anon, authenticated;
GRANT UPDATE ON payments TO authenticated;

GRANT SELECT ON reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON reviews TO authenticated;

GRANT SELECT ON coupons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON coupons TO authenticated;

GRANT SELECT, INSERT, DELETE ON favorites TO authenticated;

GRANT SELECT ON coupon_redemptions TO authenticated;
GRANT INSERT ON coupon_redemptions TO anon, authenticated;

-- ====== PROFILES POLICIES ======
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
CREATE POLICY "profiles_select_own_or_admin" ON profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;
CREATE POLICY "profiles_insert_self" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ====== RESTAURANTS POLICIES ======
DROP POLICY IF EXISTS "restaurants_public_read_approved" ON restaurants;
CREATE POLICY "restaurants_public_read_approved" ON restaurants FOR SELECT
  TO anon, authenticated USING (
    approval_status = 'approved'
    OR owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "restaurants_owner_insert" ON restaurants;
CREATE POLICY "restaurants_owner_insert" ON restaurants FOR INSERT
  TO authenticated WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('restaurant_owner','admin'))
  );

DROP POLICY IF EXISTS "restaurants_owner_or_admin_update" ON restaurants;
CREATE POLICY "restaurants_owner_or_admin_update" ON restaurants FOR UPDATE
  TO authenticated USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "restaurants_owner_or_admin_delete" ON restaurants;
CREATE POLICY "restaurants_owner_or_admin_delete" ON restaurants FOR DELETE
  TO authenticated USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ====== FOOD_CATEGORIES POLICIES ======
DROP POLICY IF EXISTS "categories_read_via_restaurant" ON food_categories;
CREATE POLICY "categories_read_via_restaurant" ON food_categories FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = food_categories.restaurant_id
      AND (r.approval_status = 'approved' OR r.owner_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')))
  );

DROP POLICY IF EXISTS "categories_owner_insert" ON food_categories;
CREATE POLICY "categories_owner_insert" ON food_categories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = food_categories.restaurant_id
      AND (r.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')))
  );

DROP POLICY IF EXISTS "categories_owner_update" ON food_categories;
CREATE POLICY "categories_owner_update" ON food_categories FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = food_categories.restaurant_id
      AND (r.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')))
  );

DROP POLICY IF EXISTS "categories_owner_delete" ON food_categories;
CREATE POLICY "categories_owner_delete" ON food_categories FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = food_categories.restaurant_id
      AND (r.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')))
  );

-- ====== FOODS POLICIES ======
DROP POLICY IF EXISTS "foods_read_via_restaurant" ON foods;
CREATE POLICY "foods_read_via_restaurant" ON foods FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = foods.restaurant_id
      AND (r.approval_status = 'approved' OR r.owner_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')))
  );

DROP POLICY IF EXISTS "foods_owner_insert" ON foods;
CREATE POLICY "foods_owner_insert" ON foods FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = foods.restaurant_id
      AND (r.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')))
  );

DROP POLICY IF EXISTS "foods_owner_update" ON foods;
CREATE POLICY "foods_owner_update" ON foods FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = foods.restaurant_id
      AND (r.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')))
  );

DROP POLICY IF EXISTS "foods_owner_delete" ON foods;
CREATE POLICY "foods_owner_delete" ON foods FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = foods.restaurant_id
      AND (r.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')))
  );

-- ====== ADDRESSES POLICIES ======
DROP POLICY IF EXISTS "addresses_select_own" ON addresses;
CREATE POLICY "addresses_select_own" ON addresses FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "addresses_insert_own" ON addresses;
CREATE POLICY "addresses_insert_own" ON addresses FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "addresses_update_own" ON addresses;
CREATE POLICY "addresses_update_own" ON addresses FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "addresses_delete_own" ON addresses;
CREATE POLICY "addresses_delete_own" ON addresses FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ====== RESTAURANT_TABLES POLICIES ======
DROP POLICY IF EXISTS "tables_read_via_restaurant" ON restaurant_tables;
CREATE POLICY "tables_read_via_restaurant" ON restaurant_tables FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_tables.restaurant_id
      AND (r.owner_id = auth.uid() OR r.approval_status = 'approved'
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')))
  );

DROP POLICY IF EXISTS "tables_owner_insert" ON restaurant_tables;
CREATE POLICY "tables_owner_insert" ON restaurant_tables FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_tables.restaurant_id
      AND (r.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')))
  );

DROP POLICY IF EXISTS "tables_owner_update" ON restaurant_tables;
CREATE POLICY "tables_owner_update" ON restaurant_tables FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_tables.restaurant_id
      AND (r.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')))
  );

DROP POLICY IF EXISTS "tables_owner_delete" ON restaurant_tables;
CREATE POLICY "tables_owner_delete" ON restaurant_tables FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM restaurants r WHERE r.id = restaurant_tables.restaurant_id
      AND (r.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')))
  );

-- ====== ORDERS POLICIES ======
DROP POLICY IF EXISTS "orders_select_customer_or_owner_or_token" ON orders;
CREATE POLICY "orders_select_customer_or_owner_or_token" ON orders FOR SELECT
  TO anon, authenticated USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM restaurants r WHERE r.id = orders.restaurant_id AND r.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "orders_insert_customer" ON orders;
CREATE POLICY "orders_insert_customer" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "orders_update_owner_or_admin" ON orders;
CREATE POLICY "orders_update_owner_or_admin" ON orders FOR UPDATE
  TO authenticated USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM restaurants r WHERE r.id = orders.restaurant_id AND r.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM restaurants r WHERE r.id = orders.restaurant_id AND r.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ====== ORDER_ITEMS POLICIES ======
DROP POLICY IF EXISTS "order_items_select_via_order" ON order_items;
CREATE POLICY "order_items_select_via_order" ON order_items FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_items.order_id
      AND (o.customer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM restaurants r WHERE r.id = o.restaurant_id AND r.owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')))
  );

DROP POLICY IF EXISTS "order_items_insert_via_order" ON order_items;
CREATE POLICY "order_items_insert_via_order" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- ====== ORDER_STATUS_HISTORY POLICIES ======
DROP POLICY IF EXISTS "status_history_select_via_order" ON order_status_history;
CREATE POLICY "status_history_select_via_order" ON order_status_history FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_status_history.order_id
      AND (o.customer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM restaurants r WHERE r.id = o.restaurant_id AND r.owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')))
  );

DROP POLICY IF EXISTS "status_history_insert_via_order" ON order_status_history;
CREATE POLICY "status_history_insert_via_order" ON order_status_history FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- ====== PAYMENTS POLICIES ======
DROP POLICY IF EXISTS "payments_select_via_order" ON payments;
CREATE POLICY "payments_select_via_order" ON payments FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = payments.order_id
      AND (o.customer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM restaurants r WHERE r.id = o.restaurant_id AND r.owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')))
  );

DROP POLICY IF EXISTS "payments_insert_via_order" ON payments;
CREATE POLICY "payments_insert_via_order" ON payments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "payments_update_owner_or_admin" ON payments;
CREATE POLICY "payments_update_owner_or_admin" ON payments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders o WHERE o.id = payments.order_id
      AND (EXISTS (SELECT 1 FROM restaurants r WHERE r.id = o.restaurant_id AND r.owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')))
  );

-- ====== REVIEWS POLICIES ======
DROP POLICY IF EXISTS "reviews_select_approved_or_own" ON reviews;
CREATE POLICY "reviews_select_approved_or_own" ON reviews FOR SELECT
  TO anon, authenticated USING (
    moderation_status = 'approved'
    OR customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT
  TO authenticated WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "reviews_update_own_or_admin" ON reviews;
CREATE POLICY "reviews_update_own_or_admin" ON reviews FOR UPDATE
  TO authenticated USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "reviews_delete_own_or_admin" ON reviews;
CREATE POLICY "reviews_delete_own_or_admin" ON reviews FOR DELETE
  TO authenticated USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ====== COUPONS POLICIES ======
DROP POLICY IF EXISTS "coupons_select_active" ON coupons;
CREATE POLICY "coupons_select_active" ON coupons FOR SELECT
  TO anon, authenticated USING (
    is_active = true
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM restaurants r WHERE r.id = coupons.restaurant_id AND r.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "coupons_admin_or_owner_insert" ON coupons;
CREATE POLICY "coupons_admin_or_owner_insert" ON coupons FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM restaurants r WHERE r.id = coupons.restaurant_id AND r.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "coupons_admin_or_owner_update" ON coupons;
CREATE POLICY "coupons_admin_or_owner_update" ON coupons FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM restaurants r WHERE r.id = coupons.restaurant_id AND r.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "coupons_admin_or_owner_delete" ON coupons;
CREATE POLICY "coupons_admin_or_owner_delete" ON coupons FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    OR EXISTS (SELECT 1 FROM restaurants r WHERE r.id = coupons.restaurant_id AND r.owner_id = auth.uid())
  );

-- ====== FAVORITES POLICIES ======
DROP POLICY IF EXISTS "favorites_select_own" ON favorites;
CREATE POLICY "favorites_select_own" ON favorites FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "favorites_insert_own" ON favorites;
CREATE POLICY "favorites_insert_own" ON favorites FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "favorites_delete_own" ON favorites;
CREATE POLICY "favorites_delete_own" ON favorites FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ====== COUPON_REDEMPTIONS POLICIES ======
DROP POLICY IF EXISTS "redemptions_select_own_or_admin" ON coupon_redemptions;
CREATE POLICY "redemptions_select_own_or_admin" ON coupon_redemptions FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "redemptions_insert" ON coupon_redemptions;
CREATE POLICY "redemptions_insert" ON coupon_redemptions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
