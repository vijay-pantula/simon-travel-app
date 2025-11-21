import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { extractAirportCode } from '../../utils/flightUtils';

interface CarSearchPanelProps {
    assignmentId: string;
    onSearchComplete: () => void;
}

export function CarSearchPanel({ assignmentId, onSearchComplete }: CarSearchPanelProps) {
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
                pickupDate: `${assignment.departure_date}T10:00:00`,
                dropoffDate: assignment.return_date ? `${assignment.return_date}T10:00:00` : `${assignment.departure_date}T10:00:00`,
                pickupLocation: cityCode,
                dropoffLocation: cityCode
            };

            // 3. Call Amadeus API via Edge Function
            const { data: carsData, error: fnError } = await supabase.functions.invoke('search-cars', {
                body: searchParams
            });

            if (fnError) throw fnError;
            if (carsData.error) throw new Error(carsData.error);

            // 4. Process results
            const cars = carsData.data || [];

            if (cars.length === 0) {
                throw new Error('No car rentals found for these dates/location.');
            }

            // 5. Save via Edge Function (PostgREST can't access car_searches table)
            const { data: saveData, error: saveError } = await supabase.functions.invoke('save-car-search', {
                body: {
                    assignmentId,
                    searchParams,
                    cars
                }
            });

            if (saveError) throw saveError;
            if (saveData?.error) throw new Error(saveData.error);

            setSuccess(`Found ${saveData.count} car rentals`);
            if (onSearchComplete) onSearchComplete();

        } catch (err) {
            console.error('Car search error:', err);
            setError(err instanceof Error ? err.message : 'Search failed');
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Car Rental Search</h3>
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
                    {searching ? 'Searching Amadeus...' : 'Search Cars'}
                </button>
            </div>
        </div>
    );
}
