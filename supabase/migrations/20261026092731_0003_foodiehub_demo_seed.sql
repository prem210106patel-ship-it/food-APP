/*
# FoodieHub Demo Data Seed

Creates demo restaurants, food categories, foods, coupons, and tables.
Demo owner: owner@foodiehub.demo / demo123456
*/

INSERT INTO profiles (id, name, normalized_email, role, phone)
VALUES ('a0000000-0000-4000-8000-000000000001', 'Demo Restaurant Owner', 'owner@foodiehub.demo', 'restaurant_owner', '+919999900001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO restaurants (id, owner_id, name, slug, description, cuisine, address, city, delivery_fee, estimated_delivery_minutes, image_url, cover_image_url, approval_status, availability_status, rating, price_level, is_featured)
VALUES
('b1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Spice Garden', 'spice-garden', 'Authentic North Indian cuisine with rich flavors and aromatic spices.', ARRAY['Indian','Mughlai','North Indian'], '42 Brigade Road, Ashok Nagar', 'Bengaluru', 3000, 35, 'https://images.pexels.com/photos/9792458/pexels-photo-9792458.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://images.pexels.com/photos/958547/pexels-photo-958547.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'approved', 'open', 4.5, 2, true),
('b1000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Pizza Italia', 'pizza-italia', 'Wood-fired pizzas, fresh pasta, and authentic Italian flavors.', ARRAY['Italian','Continental'], '15 100 Feet Road, Indiranagar', 'Bengaluru', 2000, 25, 'https://images.pexels.com/photos/4109132/pexels-photo-4109132.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://images.pexels.com/photos/4109116/pexels-photo-4109116.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'approved', 'open', 4.3, 3, true),
('b1000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Burger Junction', 'burger-junction', 'Juicy burgers, crispy fries, and loaded shakes.', ARRAY['Fast Food','American'], '8 Koramangala 5th Block', 'Bengaluru', 0, 20, 'https://images.pexels.com/photos/2299981/pexels-photo-2299981.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://images.pexels.com/photos/5374419/pexels-photo-5374419.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'approved', 'open', 4.1, 1, false)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO food_categories (id, restaurant_id, name, sort_order) VALUES
('c1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'Starters', 1),
('c1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000001', 'Main Course', 2),
('c1000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000001', 'Breads & Rice', 3),
('c2000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002', 'Pizzas', 1),
('c2000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000002', 'Pasta', 2),
('c2000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000002', 'Sides', 3),
('c3000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000003', 'Burgers', 1),
('c3000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000003', 'Sides', 2),
('c3000000-0000-4000-8000-000000000003', 'b1000000-0000-4000-8000-000000000003', 'Beverages', 3)
ON CONFLICT (restaurant_id, name) DO NOTHING;

INSERT INTO foods (restaurant_id, category_id, name, slug, description, price, image_url, dietary_labels, allergen_information, spice_level, preparation_time, is_available, is_popular) VALUES
('b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'Paneer Tikka', 'paneer-tikka', 'Marinated cottage cheese grilled in a tandoor with bell peppers and spices.', 22000, 'https://images.pexels.com/photos/33643313/pexels-photo-33643313.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['vegetarian'], ARRAY['dairy'], 2, 15, true, true),
('b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'Chicken 65', 'chicken-65', 'Spicy deep-fried chicken with curry leaves and green chilies.', 18000, 'https://images.pexels.com/photos/28674566/pexels-photo-28674566.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['non_vegetarian'], ARRAY[]::text[], 3, 12, true, true),
('b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000002', 'Butter Chicken', 'butter-chicken', 'Creamy tomato-based curry with tender chicken pieces.', 28000, 'https://images.pexels.com/photos/40262818/pexels-photo-40262818.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['non_vegetarian'], ARRAY['dairy'], 1, 20, true, true),
('b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000002', 'Dal Makhani', 'dal-makhani', 'Slow-cooked black lentils in a rich, creamy gravy.', 16000, 'https://images.pexels.com/photos/20408445/pexels-photo-20408445.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['vegetarian'], ARRAY['dairy'], 1, 25, true, false),
('b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000003', 'Butter Naan', 'butter-naan', 'Soft tandoor-baked flatbread brushed with butter.', 4000, 'https://images.pexels.com/photos/36388454/pexels-photo-36388454.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['vegetarian'], ARRAY['dairy','gluten'], 0, 8, true, true),
('b1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000003', 'Veg Biryani', 'veg-biryani', 'Fragrant basmati rice cooked with vegetables, saffron, and aromatic spices.', 19000, 'https://images.pexels.com/photos/20422123/pexels-photo-20422123.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['vegetarian'], ARRAY['dairy'], 2, 30, true, true),
('b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000001', 'Margherita Pizza', 'margherita-pizza', 'Classic pizza with fresh mozzarella, basil, and San Marzano tomato sauce.', 25000, 'https://images.pexels.com/photos/4109132/pexels-photo-4109132.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['vegetarian'], ARRAY['dairy','gluten'], 0, 18, true, true),
('b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000001', 'Pepperoni Pizza', 'pepperoni-pizza', 'Loaded with pepperoni slices and mozzarella on a wood-fired crust.', 32000, 'https://images.pexels.com/photos/19786212/pexels-photo-19786212.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['non_vegetarian'], ARRAY['dairy','gluten'], 1, 18, true, true),
('b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000002', 'Penne Alfredo', 'penne-alfredo', 'Pasta in a rich, creamy parmesan sauce with herbs.', 24000, 'https://images.pexels.com/photos/4109116/pexels-photo-4109116.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['vegetarian'], ARRAY['dairy','gluten'], 0, 15, true, false),
('b1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000003', 'Garlic Bread', 'garlic-bread', 'Crispy bread topped with garlic butter and herbs.', 12000, 'https://images.pexels.com/photos/4109136/pexels-photo-4109136.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['vegetarian'], ARRAY['dairy','gluten'], 0, 8, true, true),
('b1000000-0000-4000-8000-000000000003', 'c3000000-0000-4000-8000-000000000001', 'Classic Cheeseburger', 'classic-cheeseburger', 'Juicy beef patty with melted cheese, lettuce, and tomato in a brioche bun.', 18000, 'https://images.pexels.com/photos/2299981/pexels-photo-2299981.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['non_vegetarian'], ARRAY['dairy','gluten'], 0, 12, true, true),
('b1000000-0000-4000-8000-000000000003', 'c3000000-0000-4000-8000-000000000001', 'Veg Burger', 'veg-burger', 'Crispy vegetable patty with fresh greens and chipotle mayo.', 15000, 'https://images.pexels.com/photos/5374419/pexels-photo-5374419.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['vegetarian'], ARRAY['dairy','gluten'], 1, 10, true, true),
('b1000000-0000-4000-8000-000000000003', 'c3000000-0000-4000-8000-000000000002', 'Loaded Fries', 'loaded-fries', 'Crispy fries topped with cheese sauce, jalapenos, and herbs.', 12000, 'https://images.pexels.com/photos/6643712/pexels-photo-6643712.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['vegetarian'], ARRAY['dairy'], 2, 8, true, true),
('b1000000-0000-4000-8000-000000000003', 'c3000000-0000-4000-8000-000000000003', 'Chocolate Shake', 'chocolate-shake', 'Thick and creamy chocolate milkshake.', 14000, 'https://images.pexels.com/photos/19685655/pexels-photo-19685655.png?auto=compress&cs=tinysrgb&h=650&w=940', ARRAY['vegetarian'], ARRAY['dairy'], 0, 5, true, false)
ON CONFLICT (restaurant_id, slug) DO NOTHING;

INSERT INTO coupons (code, description, discount_type, discount_value, minimum_order_amount, maximum_discount, is_active) VALUES
('WELCOME10', '10% off your first order', 'percentage', 1000, 20000, 5000, true),
('FLAT50', 'Flat 50 rupees off on orders above 300', 'fixed', 5000, 30000, 0, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO restaurant_tables (restaurant_id, table_number, seats, public_token_hash, is_active)
VALUES
('b1000000-0000-4000-8000-000000000001', 'T1', 4, encode(digest('demo-table-token-t1', 'sha256'), 'hex'), true),
('b1000000-0000-4000-8000-000000000001', 'T2', 2, encode(digest('demo-table-token-t2', 'sha256'), 'hex'), true),
('b1000000-0000-4000-8000-000000000001', 'T3', 6, encode(digest('demo-table-token-t3', 'sha256'), 'hex'), true)
ON CONFLICT (restaurant_id, table_number) DO NOTHING;
