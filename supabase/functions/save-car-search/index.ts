import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { assignmentId, searchParams, cars } = await req.json();

    const { data: search, error: searchError } = await supabaseClient
      .from("car_searches")
      .insert({
        assignment_id: assignmentId,
        search_params: searchParams,
        executed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (searchError) throw searchError;

    const carOptions = cars.map((car: any) => ({
      search_id: search.id,
      provider_code: car.provider.code,
      provider_name: car.provider.name,
      vehicle_class: car.vehicle.category,
      vehicle_description: car.vehicle.description,
      price_total: parseFloat(car.price.total),
      currency: car.price.currency,
      pickup_location: searchParams.pickupLocation,
      dropoff_location: searchParams.dropoffLocation,
      pickup_date: searchParams.pickupDate,
      dropoff_date: searchParams.dropoffDate,
      image_url: car.vehicle.imageURL || null,
      booking_url: "https://www.rentalcars.com/",
    }));

    const { error: optionsError } = await supabaseClient
      .from("car_options")
      .insert(carOptions);

    if (optionsError) throw optionsError;

    if (cars.length > 0) {
      const maxPrice = Math.max(...cars.map((c: any) => parseFloat(c.price.total)));

      await supabaseClient
        .from("project_assignments")
        .update({ car_benchmark_price: maxPrice })
        .eq("id", assignmentId);
    }

    return new Response(
      JSON.stringify({ success: true, searchId: search.id, count: cars.length }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in save-car-search function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
