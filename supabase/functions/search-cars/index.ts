import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const AMADEUS_CLIENT_ID = Deno.env.get('AMADEUS_CLIENT_ID')
const AMADEUS_CLIENT_SECRET = Deno.env.get('AMADEUS_CLIENT_SECRET')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { cityCode, pickupDate, dropoffDate } = await req.json()

        // 1. Get Amadeus Access Token
        const authResponse = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `grant_type=client_credentials&client_id=${AMADEUS_CLIENT_ID}&client_secret=${AMADEUS_CLIENT_SECRET}`,
        })

        const authData = await authResponse.json()
        const accessToken = authData.access_token

        if (!accessToken) {
            throw new Error('Failed to authenticate with Amadeus')
        }

        // 2. Search Car Offers
        // Using Amadeus Shopping Car Offers API
        // Note: In test environment, data is limited.
        const searchUrl = new URL('https://test.api.amadeus.com/v1/shopping/transfer-offers') // Using transfer offers as a proxy for car rental in test env if car rental is restricted, or use actual car rental endpoint if available.
        // Actually, let's use the standard Car Rental API: /v1/shopping/car-offers is deprecated in favor of v4? No, v1 is still common for test.
        // Let's try /v1/shopping/car-offers?pickUpLocation={cityCode}

        // However, for simplicity and likely success in test env, we need a valid city code.
        // Amadeus Test API often requires specific cities like PAR, LON, NYC.

        // Let's construct the URL for Car Offers
        // https://developers.amadeus.com/self-service/category/car-rental/api-doc/car-rental-offers/api-reference
        // GET /v1/shopping/car-offers

        const params = new URLSearchParams({
            "pickUpLocation": cityCode,
            "pickUpDateTime": pickupDate,
            "dropOffLocation": cityCode, // Return to same location for simplicity
            "dropOffDateTime": dropoffDate,
            "adults": "1"
        });

        console.log(`Searching cars for ${cityCode} from ${pickupDate} to ${dropoffDate}`);

        const response = await fetch(`https://test.api.amadeus.com/v1/shopping/car-offers?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Amadeus API Error:', data)
            // If 400/500 from Amadeus, return empty list or specific error
            return new Response(
                JSON.stringify({ error: data.errors?.[0]?.detail || 'Failed to fetch car offers' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        return new Response(
            JSON.stringify({ data: data.data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
