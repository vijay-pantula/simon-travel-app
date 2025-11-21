import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CarSearchRequest {
  cityCode: string;
  pickupDate: string;
  dropoffDate: string;
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
    const searchParams: CarSearchRequest = await req.json();

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

    const searchUrl = new URL(
      "https://test.api.amadeus.com/v1/shopping/car-offers"
    );

    searchUrl.searchParams.append("pickUpLocation", searchParams.cityCode);
    searchUrl.searchParams.append("pickUpDateTime", searchParams.pickupDate);
    searchUrl.searchParams.append("dropOffLocation", searchParams.cityCode);
    searchUrl.searchParams.append("dropOffDateTime", searchParams.dropoffDate);
    searchUrl.searchParams.append("adults", "1");

    const carsResponse = await fetch(searchUrl.toString(), {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!carsResponse.ok) {
      const errorText = await carsResponse.text();
      console.error("Amadeus API error:", errorText);
      throw new Error(`Car search failed: ${carsResponse.statusText}`);
    }

    const carsData = await carsResponse.json();

    return new Response(JSON.stringify(carsData), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in search-cars function:", error);
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
