import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { extractAirportCode } from '../../utils/flightUtils';

interface HotelSearchPanelProps {
    assignmentId: string;
    onSearchComplete: () => void;
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
            // 1. Fetch assignment details
            const { data: assignment } = await supabase
                .from('project_assignments')
                .select(`
          *,
          project:projects(*),
          consultant:consultants(*)
        `)
                .eq('id', assignmentId)
                .single();

            if (!assignment) throw new Error('Assignment not found');

            // 2. Prepare search parameters
            const cityCode = extractAirportCode(assignment.travel_to_location);

            const searchParams = {
                cityCode,
                checkInDate: assignment.departure_date,
                checkOutDate: assignment.return_date,
                adults: 1,
                roomQuantity: 1
            };

            // 3. Call Amadeus API via Edge Function
            const { data: hotelsData, error: fnError } = await supabase.functions.invoke('search-hotels', {
                body: searchParams
            });

            if (fnError) throw fnError;
            if (hotelsData.error) throw new Error(hotelsData.error);

            // 4. Process results
            const hotels = hotelsData.data || [];

            if (hotels.length === 0) {
                throw new Error('No hotels found for these dates/location.');
            }

            // 5. Save via Edge Function (PostgREST can't access hotel_searches table)
            const { data: saveData, error: saveError } = await supabase.functions.invoke('save-hotel-search', {
                body: {
                    assignmentId,
                    searchParams,
                    hotels
                }
            });

            if (saveError) throw saveError;
            if (saveData?.error) throw new Error(saveData.error);

            setSuccess(`Found ${saveData.count} hotels`);
            if (onSearchComplete) onSearchComplete();

        } catch (err) {
            console.error('Hotel search error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(`Search failed: ${errorMessage}`);
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Hotel Search</h3>
                {searching && <Loader className="w-5 h-5 text-blue-600 animate-spin" />}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    {success}
                </div>
            )}

            <div className="flex gap-3">
                <button
                    onClick={handleSearch}
                    disabled={searching}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    <Search className="w-4 h-4" />
                    {searching ? 'Searching Amadeus...' : 'Search Hotels'}
                </button>
            </div>
        </div>
    );
}
