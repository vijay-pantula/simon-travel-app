import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FlightSearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  cabinClass?: string;
}

interface AmadeusTokenResponse {
  access_token: string;
  expires_in: number;
}

const AMADEUS_API_KEY = "T3B4dlPssGYLmFn2jZelGsJfHoml2M4G";
const AMADEUS_API_SECRET = "QivjJfRcjA1GO9Yq";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const searchParams: FlightSearchRequest = await req.json();

    // Get Amadeus access token
    const tokenResponse = await fetch(
      "https://test.api.amadeus.com/v1/security/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: AMADEUS_API_KEY,
          client_secret: AMADEUS_API_SECRET,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Amadeus auth error:", errorText);
      throw new Error("Failed to authenticate with Amadeus API");
    }

    const tokenData: AmadeusTokenResponse = await tokenResponse.json();

    // Search for flights
    const searchUrl = new URL(
      "https://test.api.amadeus.com/v2/shopping/flight-offers"
    );
    searchUrl.searchParams.append("originLocationCode", searchParams.origin);
    searchUrl.searchParams.append(
      "destinationLocationCode",
      searchParams.destination
    );
    searchUrl.searchParams.append("departureDate", searchParams.departureDate);
    if (searchParams.returnDate) {
      searchUrl.searchParams.append("returnDate", searchParams.returnDate);
    }
    searchUrl.searchParams.append("adults", searchParams.adults.toString());
    searchUrl.searchParams.append("max", "10");
    if (searchParams.cabinClass) {
      searchUrl.searchParams.append("travelClass", searchParams.cabinClass.toUpperCase());
    }

    const flightsResponse = await fetch(searchUrl.toString(), {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!flightsResponse.ok) {
      const errorText = await flightsResponse.text();
      console.error("Amadeus API error:", errorText);
      throw new Error(`Flight search failed: ${flightsResponse.statusText}`);
    }

    const flightsData = await flightsResponse.json();

    return new Response(JSON.stringify(flightsData), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in search-flights function:", error);
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
