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

    const { assignmentId, searchParams, hotels } = await req.json();

    const { data: search, error: searchError } = await supabaseClient
      .from("hotel_searches")
      .insert({
        assignment_id: assignmentId,
        search_params: searchParams,
        executed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (searchError) throw searchError;

    const hotelOptions = hotels.map((offer: any) => ({
      search_id: search.id,
      hotel_name: offer.hotel.name,
      hotel_chain_code: offer.hotel.chainCode,
      city_code: offer.hotel.cityCode,
      price_total: parseFloat(offer.offers[0].price.total),
      currency: offer.offers[0].price.currency,
      check_in_date: offer.offers[0].checkInDate,
      check_out_date: offer.offers[0].checkOutDate,
      rating: offer.hotel.rating,
      amenities: offer.hotel.amenities || [],
      booking_url: `https://www.booking.com/searchresults.html?ss=${offer.hotel.cityCode}`,
    }));

    const { error: optionsError } = await supabaseClient
      .from("hotel_options")
      .insert(hotelOptions);

    if (optionsError) throw optionsError;

    if (hotels.length > 0) {
      const maxPrice = Math.max(
        ...hotels.map((h: any) => parseFloat(h.offers[0].price.total))
      );

      await supabaseClient
        .from("project_assignments")
        .update({ hotel_benchmark_price: maxPrice })
        .eq("id", assignmentId);
    }

    return new Response(
      JSON.stringify({ success: true, searchId: search.id, count: hotels.length }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in save-hotel-search function:", error);
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
