import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Loader, AlertCircle } from 'lucide-react';
import { extractAirportCode } from '../../utils/flightUtils';

interface FlightSearchPanelProps {
  assignmentId: string;
  onSearchComplete?: () => void;
}

export function FlightSearchPanel({ assignmentId, onSearchComplete }: FlightSearchPanelProps) {
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSearch = async () => {
    setSearching(true);
    setError('');
    setSuccess('');

    try {
      const { data: assignment } = await supabase
        .from('project_assignments')
        .select(`
          *,
          project:projects(*),
          consultant:consultants(*)
        `)
        .eq('id', assignmentId)
        .single();

      if (!assignment) {
        throw new Error('Assignment not found');
      }

      const { data: rules } = await supabase
        .from('project_rules')
        .select('*')
        .eq('project_id', assignment.project_id)
        .maybeSingle();

      const searchParams = {
        from: assignment.travel_from_location,
        to: assignment.travel_to_location,
        departure_date: assignment.departure_date,
        return_date: assignment.return_date,
        rules: rules,
        consultant_preferences: assignment.consultant?.preferences || {}
      };

      const { data: search, error: searchError } = await supabase
        .from('flight_searches')
        .insert({
          assignment_id: assignmentId,
          search_params: searchParams,
          executed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (searchError) throw searchError;

      const amadeusRequest = {
        origin: extractAirportCode(assignment.travel_from_location),
        destination: extractAirportCode(assignment.travel_to_location),
        departureDate: assignment.departure_date,
        returnDate: assignment.return_date,
        adults: 1,
        cabinClass: rules?.cabin_class || 'economy'
      };

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-flights`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const amadeusResponse = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(amadeusRequest)
      });

      if (!amadeusResponse.ok) {
        const errorData = await amadeusResponse.json().catch(() => ({}));
        console.error('Amadeus API error:', errorData);
        throw new Error(errorData.error || 'Failed to search flights');
      }

      const amadeusData = await amadeusResponse.json();
      console.log('Amadeus response:', amadeusData);

      const flightOptions = parseAmadeusResponse(search.id, amadeusData);
      console.log('Parsed flight options:', flightOptions.length);

      if (flightOptions.length === 0) {
        throw new Error('No flights found for the specified criteria');
      }

      const { error: optionsError } = await supabase
        .from('flight_options')
        .insert(flightOptions);

      if (optionsError) {
        console.error('Database insert error:', optionsError);
        throw optionsError;
      }

      // Update benchmark price with the maximum price from the search results
      if (flightOptions.length > 0) {
        const maxPrice = Math.max(...flightOptions.map((o: any) => o.price));

        const { error: updateError } = await supabase
          .from('project_assignments')
          .update({ flight_benchmark_price: maxPrice })
          .eq('id', assignmentId);

        if (updateError) {
          console.error('Failed to update benchmark price:', updateError);
          // We don't throw here to avoid failing the whole search flow
        }
      }

      await supabase.from('audit_logs').insert({
        action: 'flight_search_executed',
        entity_type: 'flight_search',
        entity_id: search.id,
        assignment_id: assignmentId,
        details: { options_count: flightOptions.length }
      });

      console.log('Search completed successfully!');
      setSuccess(`Found ${flightOptions.length} flight options`);
      if (onSearchComplete) onSearchComplete();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSearching(false);
    }
  };

  const generateBookingUrl = (
    origin: string,
    destination: string,
    departureDate: string,
    returnDate: string | null
  ): string => {
    const depDate = new Date(departureDate).toISOString().split('T')[0];
    const retDate = returnDate ? new Date(returnDate).toISOString().split('T')[0] : '';

    // params was unused, so removing it to fix lint error
    // const params = new URLSearchParams({
    //   from: origin,
    //   to: destination,
    //   depart: depDate,
    //   ...(retDate && { return: retDate }),
    //   adults: '1',
    //   children: '0',
    //   infants: '0',
    // });

    return `https://www.kayak.com/flights/${origin}-${destination}/${depDate}${retDate ? `/${retDate}` : ''}?sort=bestflight_a`;
  };

  const parseAmadeusResponse = (searchId: string, data: any) => {
    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.slice(0, 10).map((offer: any, index: number) => {
      const outboundSegments = offer.itineraries[0]?.segments || [];
      const returnSegments = offer.itineraries[1]?.segments || [];

      const carriers = new Set<string>();
      outboundSegments.forEach((seg: any) => carriers.add(seg.carrierCode));
      returnSegments.forEach((seg: any) => carriers.add(seg.carrierCode));

      const outboundDuration = parseDuration(offer.itineraries[0]?.duration);
      const returnDuration = offer.itineraries[1] ? parseDuration(offer.itineraries[1].duration) : 0;

      const departureDate = outboundSegments[0]?.departure?.at;
      const returnDate = returnSegments[0]?.departure?.at;

      // Extract airport codes from segments if available, otherwise fallback to search params (which we don't have here easily without passing them down)
      // But actually, we can just use the segment info.
      const originAirport = outboundSegments[0]?.departure?.iataCode || 'XXX';
      const destinationAirport = outboundSegments[outboundSegments.length - 1]?.arrival?.iataCode || 'XXX';

      return {
        search_id: searchId,
        option_number: index + 1,
        price: parseFloat(offer.price.total),
        currency: offer.price.currency,
        cabin_class: outboundSegments[0]?.cabin || 'economy',
        carrier: outboundSegments[0]?.carrierCode || 'XX',
        carriers: Array.from(carriers),
        layovers: Math.max(outboundSegments.length - 1, 0),
        total_duration_minutes: outboundDuration + returnDuration,
        baggage_included: (offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity || 0) > 0,
        refundable: false,
        outbound_departure: departureDate,
        outbound_arrival: outboundSegments[outboundSegments.length - 1]?.arrival?.at,
        return_departure: returnDate,
        return_arrival: returnSegments.length > 0 ? returnSegments[returnSegments.length - 1]?.arrival?.at : null,
        origin_airport: originAirport,
        destination_airport: destinationAirport,
        booking_url: generateBookingUrl(originAirport, destinationAirport, departureDate, returnDate),
        offer_id: offer.id,
        full_payload: offer
      };
    });
  };

  const parseDuration = (duration: string): number => {
    if (!duration) return 0;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return 0;
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    return hours * 60 + minutes;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Flight Search</h3>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {success}
        </div>
      )}

      <p className="text-sm text-slate-600 mb-4">
        Search for real-time flight options using Amadeus API based on project rules and consultant preferences
      </p>

      <button
        onClick={handleSearch}
        disabled={searching}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {searching ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Search Flights
          </>
        )}
      </button>
    </div>
  );
}
