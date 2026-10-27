/*
# Add demo admin user

Creates a demo admin auth user and profile for testing the admin panel.
Demo admin: admin@foodiehub.demo / admin123456
*/
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, last_sign_in_at,
  confirmation_token, recovery_token
) VALUES (
  'a0000000-0000-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@foodiehub.demo',
  crypt('admin123456', gen_salt('bf')),
  now(), now(), now(), now(),
  '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, name, normalized_email, role, phone)
VALUES ('a0000000-0000-4000-8000-000000000002', 'Demo Admin', 'admin@foodiehub.demo', 'admin', '+919999900002')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
