import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Loader, AlertCircle } from 'lucide-react';
import { extractAirportCode } from '../../utils/flightUtils';

interface HotelSearchPanelProps {
  assignmentId: string;
  onSearchComplete?: () => void;
}

export function HotelSearchPanel({ assignmentId, onSearchComplete }: HotelSearchPanelProps) {
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

      const cityCode = extractAirportCode(assignment.travel_to_location);

      const searchParams = {
        cityCode,
        checkInDate: assignment.departure_date,
        checkOutDate: assignment.return_date,
        adults: 1,
        roomQuantity: 1
      };

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-hotels`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const amadeusResponse = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(searchParams)
      });

      if (!amadeusResponse.ok) {
        const errorData = await amadeusResponse.json().catch(() => ({}));
        console.error('Amadeus API error:', errorData);
        throw new Error(errorData.error || 'Failed to search hotels');
      }

      const amadeusData = await amadeusResponse.json();
      console.log('Amadeus response:', amadeusData);

      const hotels = amadeusData.data || [];

      if (hotels.length === 0) {
        throw new Error('No hotels found for these dates/location.');
      }

      const saveApiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-hotel-search`;
      const saveResponse = await fetch(saveApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          assignmentId,
          searchParams,
          hotels
        })
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => ({}));
        console.error('Save error:', errorData);
        throw new Error(errorData.error || 'Failed to save hotel search');
      }

      const saveData = await saveResponse.json();

      await supabase.from('audit_logs').insert({
        action: 'hotel_search_executed',
        entity_type: 'hotel_search',
        entity_id: saveData.searchId,
        assignment_id: assignmentId,
        details: { options_count: saveData.count }
      });

      console.log('Search completed successfully!');
      setSuccess(`Found ${saveData.count} hotel options`);
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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Hotel Search</h3>

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
        Search for real-time hotel options using Amadeus API based on travel dates
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
            Search Hotels
          </>
        )}
      </button>
    </div>
  );
}
