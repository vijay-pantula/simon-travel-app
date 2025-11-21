import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log('save-hotel-search: Starting function')

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        console.log('save-hotel-search: Supabase client created')

        const { assignmentId, searchParams, hotels } = await req.json()
        console.log('save-hotel-search: Received data:', { assignmentId, hotelCount: hotels?.length })

        // 1. Create hotel search record
        console.log('save-hotel-search: Inserting hotel search record')
        const { data: search, error: searchError } = await supabaseClient
            .from('hotel_searches')
            .insert({
                assignment_id: assignmentId,
                search_params: searchParams,
                executed_at: new Date().toISOString()
            })
            .select()
            .single()

        if (searchError) {
            console.error('save-hotel-search: Search insert error:', searchError)
            throw searchError
        }
        console.log('save-hotel-search: Search record created:', search.id)

        // 2. Insert hotel options
        console.log('save-hotel-search: Preparing hotel options')
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
            booking_url: `https://www.booking.com/searchresults.html?ss=${offer.hotel.cityCode}`
        }))

        console.log('save-hotel-search: Inserting hotel options:', hotelOptions.length)
        const { error: optionsError } = await supabaseClient
            .from('hotel_options')
            .insert(hotelOptions)

        if (optionsError) {
            console.error('save-hotel-search: Options insert error:', optionsError)
            throw optionsError
        }
        console.log('save-hotel-search: Hotel options inserted successfully')

        // 3. Update benchmark price
        if (hotels.length > 0) {
            const maxPrice = Math.max(...hotels.map((h: any) => parseFloat(h.offers[0].price.total)))
            console.log('save-hotel-search: Updating benchmark price:', maxPrice)

            await supabaseClient
                .from('project_assignments')
                .update({ hotel_benchmark_price: maxPrice })
                .eq('id', assignmentId)
        }

        console.log('save-hotel-search: Function completed successfully')
        return new Response(
            JSON.stringify({ success: true, searchId: search.id, count: hotels.length }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('save-hotel-search: Fatal error:', error)
        return new Response(
            JSON.stringify({ error: error.message, details: error.toString() }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
