import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

if (req.method === "OPTIONS") {
  return new Response(null, { status: 200, headers: corsHeaders });
}

try {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Server not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "8", 10), 20);
  const dietary = url.searchParams.get("dietary") || "";
  const cuisine = url.searchParams.get("cuisine") || "";

  let query = supabase
    .from("foods")
    .select(`
      id, name, slug, description, price, image_url, dietary_labels,
      spice_level, preparation_time, is_popular,
      restaurant:restaurants(id, name, slug, delivery_fee, rating, cuisine)
    `)
    .eq("is_available", true);

  if (dietary) {
    query = query.contains("dietary_labels", [dietary]);
  }

  if (cuisine) {
    query = query.filter("restaurant.cuisine", "cs", `["${cuisine}"]`);
  }

  const { data: foods, error } = await query
    .order("is_popular", { ascending: false })
    .limit(limit * 3);

  if (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch foods" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!foods || foods.length === 0) {
    return new Response(JSON.stringify({ recommendations: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const scored = foods.map((food) => {
    let score = 0;
    if (food.is_popular) score += 50;
    if (food.restaurant?.rating) score += Number(food.restaurant.rating) * 10;
    if (food.restaurant?.delivery_fee === 0) score += 5;
    if (food.dietary_labels?.includes("vegetarian")) score += 3;
    if (food.dietary_labels?.includes("vegan")) score += 2;
    if (food.spice_level > 0) score += 2;
    score += Math.random() * 10;
    return { ...food, _score: score };
  });

  scored.sort((a, b) => b._score - a._score);
  const recommendations = scored.slice(0, limit).map(({ _score, ...food }) => food);

  return new Response(JSON.stringify({ recommendations }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
} catch (err) {
  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
