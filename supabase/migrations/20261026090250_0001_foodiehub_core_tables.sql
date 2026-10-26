/*
# FoodieHub Core Tables

Creates foundational tables for the FoodieHub platform.
All monetary values stored as bigint minor units (paise).

## Tables
1. profiles — user metadata linked to auth.users
2. restaurants — restaurant catalog
3. food_categories — menu categories
4. foods — menu items
5. addresses — saved delivery addresses
6. restaurant_tables — dine-in tables
7. orders — delivery/dine-in orders
8. order_items — line items with snapshots
9. order_status_history — status log
10. payments — payment records
11. reviews — customer reviews
12. coupons — discount codes
13. favorites — saved foods
14. coupon_redemptions — coupon usage tracking
*/

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  normalized_email text NOT NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','restaurant_owner','admin')),
  account_status text NOT NULL DEFAULT 'active' CHECK (account_status IN ('active','suspended')),
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_normalized_email_key ON profiles (lower(normalized_email));

-- restaurants
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  cuisine text[] NOT NULL DEFAULT '{}',
  address text NOT NULL,
  city text NOT NULL,
  supported_service_area text,
  opening_hours jsonb NOT NULL DEFAULT '{}',
  delivery_fee bigint NOT NULL DEFAULT 0,
  estimated_delivery_minutes integer NOT NULL DEFAULT 30,
  image_url text,
  cover_image_url text,
  approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected')),
  availability_status text NOT NULL DEFAULT 'closed' CHECK (availability_status IN ('open','closed')),
  rating numeric(2,1) NOT NULL DEFAULT 0,
  price_level integer NOT NULL DEFAULT 2 CHECK (price_level BETWEEN 1 AND 4),
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS restaurants_slug_key ON restaurants (slug);
CREATE INDEX IF NOT EXISTS restaurants_owner_id_idx ON restaurants (owner_id);
CREATE INDEX IF NOT EXISTS restaurants_approval_status_idx ON restaurants (approval_status);
CREATE INDEX IF NOT EXISTS restaurants_city_idx ON restaurants (city);

-- food_categories
CREATE TABLE IF NOT EXISTS food_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE food_categories ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS food_categories_restaurant_id_idx ON food_categories (restaurant_id);
CREATE UNIQUE INDEX IF NOT EXISTS food_categories_restaurant_name_key ON food_categories (restaurant_id, name);

-- foods
CREATE TABLE IF NOT EXISTS foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id uuid REFERENCES food_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  price bigint NOT NULL CHECK (price >= 0),
  image_url text,
  dietary_labels text[] NOT NULL DEFAULT '{}',
  allergen_information text[] NOT NULL DEFAULT '{}',
  spice_level integer NOT NULL DEFAULT 0 CHECK (spice_level BETWEEN 0 AND 3),
  preparation_time integer NOT NULL DEFAULT 15,
  is_available boolean NOT NULL DEFAULT true,
  is_popular boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS foods_restaurant_id_idx ON foods (restaurant_id);
CREATE INDEX IF NOT EXISTS foods_category_id_idx ON foods (category_id);
CREATE UNIQUE INDEX IF NOT EXISTS foods_restaurant_slug_key ON foods (restaurant_id, slug);

-- addresses
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  recipient_name text NOT NULL,
  phone text NOT NULL,
  address_line text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  delivery_instructions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS addresses_user_id_idx ON addresses (user_id);

-- restaurant_tables
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number text NOT NULL,
  seats integer NOT NULL DEFAULT 4,
  public_token_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS restaurant_tables_restaurant_number_key ON restaurant_tables (restaurant_id, table_number);
CREATE UNIQUE INDEX IF NOT EXISTS restaurant_tables_token_hash_key ON restaurant_tables (public_token_hash);
CREATE INDEX IF NOT EXISTS restaurant_tables_restaurant_id_idx ON restaurant_tables (restaurant_id);

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  customer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE RESTRICT,
  order_type text NOT NULL CHECK (order_type IN ('delivery','dine_in')),
  table_id uuid REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','preparing','ready','out_for_delivery','delivered','cancelled','rejected')),
  payment_method text NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod','upi_qr','online')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','pending','paid','failed','refunded')),
  subtotal bigint NOT NULL DEFAULT 0,
  delivery_fee bigint NOT NULL DEFAULT 0,
  discount bigint NOT NULL DEFAULT 0,
  total bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  customer_name_snapshot text,
  customer_phone_snapshot text,
  delivery_address_snapshot jsonb,
  special_instructions text,
  tracking_token_hash text NOT NULL,
  coupon_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key ON orders (order_number);
CREATE UNIQUE INDEX IF NOT EXISTS orders_tracking_token_hash_key ON orders (tracking_token_hash);
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON orders (customer_id);
CREATE INDEX IF NOT EXISTS orders_restaurant_id_idx ON orders (restaurant_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);

-- order_items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id) ON DELETE SET NULL,
  food_name_snapshot text NOT NULL,
  unit_price bigint NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total bigint NOT NULL,
  customization_data jsonb,
  special_instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);
CREATE INDEX IF NOT EXISTS order_items_food_id_idx ON order_items (food_id);

-- order_status_history
CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS order_status_history_order_id_idx ON order_status_history (order_id);

-- payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('cod','upi_qr','razorpay','manual')),
  provider_transaction_id text,
  amount bigint NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded','cancelled')),
  verification_details jsonb,
  idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS payments_order_id_idx ON payments (order_id);
CREATE UNIQUE INDEX IF NOT EXISTS payments_idempotency_key_key ON payments (idempotency_key) WHERE idempotency_key IS NOT NULL;

-- reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id) ON DELETE SET NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  moderation_status text NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS reviews_restaurant_id_idx ON reviews (restaurant_id);
CREATE INDEX IF NOT EXISTS reviews_customer_id_idx ON reviews (customer_id);
CREATE INDEX IF NOT EXISTS reviews_moderation_status_idx ON reviews (moderation_status);

-- coupons
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value bigint NOT NULL CHECK (discount_value >= 0),
  minimum_order_amount bigint NOT NULL DEFAULT 0,
  maximum_discount bigint NOT NULL DEFAULT 0,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  usage_limit integer,
  per_user_limit integer NOT NULL DEFAULT 1,
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_key ON coupons (code);
CREATE INDEX IF NOT EXISTS coupons_restaurant_id_idx ON coupons (restaurant_id);

-- favorites
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  food_id uuid NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_food_key ON favorites (user_id, food_id);
CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites (user_id);

-- coupon_redemptions
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  discount_amount bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS coupon_redemptions_coupon_id_idx ON coupon_redemptions (coupon_id);
CREATE INDEX IF NOT EXISTS coupon_redemptions_user_id_idx ON coupon_redemptions (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS coupon_redemptions_order_key ON coupon_redemptions (order_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS restaurants_updated_at ON restaurants;
CREATE TRIGGER restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS foods_updated_at ON foods;
CREATE TRIGGER foods_updated_at BEFORE UPDATE ON foods FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS addresses_updated_at ON addresses;
CREATE TRIGGER addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS restaurant_tables_updated_at ON restaurant_tables;
CREATE TRIGGER restaurant_tables_updated_at BEFORE UPDATE ON restaurant_tables FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS payments_updated_at ON payments;
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS reviews_updated_at ON reviews;
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS coupons_updated_at ON coupons;
CREATE TRIGGER coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION set_updated_at();
