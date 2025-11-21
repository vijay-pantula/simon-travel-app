import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface HotelSearchRequest {
    cityCode: string; // IATA city code, e.g., PAR for Paris
    checkInDate: string;
    checkOutDate: string;
    adults: number;
    roomQuantity?: number;
    ratings?: string[]; // e.g. ["3", "4", "5"]
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
        const searchParams: HotelSearchRequest = await req.json();

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

        // Search for hotels
        // Using v3/shopping/hotel-offers (Search by City)
        const searchUrl = new URL(
            "https://test.api.amadeus.com/v3/shopping/hotel-offers"
        );

        searchUrl.searchParams.append("cityCode", searchParams.cityCode);
        searchUrl.searchParams.append("checkInDate", searchParams.checkInDate);
        searchUrl.searchParams.append("checkOutDate", searchParams.checkOutDate);
        searchUrl.searchParams.append("adults", searchParams.adults.toString());
        searchUrl.searchParams.append("roomQuantity", (searchParams.roomQuantity || 1).toString());
        searchUrl.searchParams.append("currency", "USD");

        if (searchParams.ratings && searchParams.ratings.length > 0) {
            searchUrl.searchParams.append("ratings", searchParams.ratings.join(","));
        }

        const hotelsResponse = await fetch(searchUrl.toString(), {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });

        if (!hotelsResponse.ok) {
            const errorText = await hotelsResponse.text();
            console.error("Amadeus API error:", errorText);
            throw new Error(`Hotel search failed: ${hotelsResponse.statusText}`);
        }

        const hotelsData = await hotelsResponse.json();

        return new Response(JSON.stringify(hotelsData), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        console.error("Error in search-hotels function:", error);
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
