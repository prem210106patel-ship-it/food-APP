/*
# Fix: Set explicit search_path on set_updated_at trigger function

Resolves the security advisor warning about mutable search_path.
*/
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
