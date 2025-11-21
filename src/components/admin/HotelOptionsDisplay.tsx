import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { HotelOption } from '../../types';
import { Building, MapPin, Star, Calendar, DollarSign, ExternalLink } from 'lucide-react';

interface HotelOptionsDisplayProps {
    options?: HotelOption[];
    searchId?: string;
}

export function HotelOptionsDisplay({ options: propOptions, searchId }: HotelOptionsDisplayProps) {
    const [options, setOptions] = useState<HotelOption[]>(propOptions || []);
    const [loading, setLoading] = useState(!propOptions && !!searchId);

    useEffect(() => {
        if (propOptions) {
            setOptions(propOptions);
            setLoading(false);
        } else if (searchId) {
            loadOptions();
        }
    }, [propOptions, searchId]);

    const loadOptions = async () => {
        if (!searchId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('hotel_options')
                .select('*')
                .eq('search_id', searchId)
                .order('price_total', { ascending: true });

            if (error) throw error;
            setOptions(data || []);
        } catch (err) {
            console.error('Error loading hotel options:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4 text-center text-slate-500">Loading hotel options...</div>;
    if (options.length === 0) return null;

    return (
        <div className="space-y-4">
            <h4 className="font-medium text-slate-900">Available Hotels ({options.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map((option) => (
                    <div key={option.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h5 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <Building className="w-4 h-4 text-slate-400" />
                                    {option.hotel_name}
                                </h5>
                                <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    {option.city_code}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-blue-600 flex items-center justify-end">
                                    <DollarSign className="w-4 h-4" />
                                    {option.price_total}
                                </div>
                                <div className="text-xs text-slate-500">{option.currency} Total</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(option.check_in_date).toLocaleDateString()} - {new Date(option.check_out_date).toLocaleDateString()}
                            </div>
                            {option.rating && (
                                <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                    {option.rating} Stars
                                </div>
                            )}
                        </div>

                        {option.amenities && option.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                                {option.amenities.slice(0, 3).map((amenity, idx) => (
                                    <span key={idx} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                                        {amenity.replace(/_/g, ' ').toLowerCase()}
                                    </span>
                                ))}
                                {option.amenities.length > 3 && (
                                    <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                                        +{option.amenities.length - 3} more
                                    </span>
                                )}
                            </div>
                        )}

                        <a
                            href={option.booking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                            View Deal <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
