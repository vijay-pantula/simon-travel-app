import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plane, Clock, Loader, ExternalLink, Award } from 'lucide-react';

import { FlightOption } from '../../types';

interface FlightOptionsDisplayProps {
  options?: FlightOption[];
  searchId?: string;
}

export function FlightOptionsDisplay({ options: propOptions, searchId }: FlightOptionsDisplayProps) {
  const [options, setOptions] = useState<FlightOption[]>(propOptions || []);
  const [loading, setLoading] = useState(!propOptions && !!searchId);
  const [scoringPreference, setScoringPreference] = useState<'balanced' | 'price' | 'duration' | 'direct'>('balanced');

  useEffect(() => {
    if (propOptions) {
      setOptions(propOptions);
      setLoading(false);
    } else if (searchId) {
      loadFlightOptions();
    }
  }, [propOptions, searchId]);

  const loadFlightOptions = async () => {
    if (!searchId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('flight_options')
        .select('*')
        .eq('search_id', searchId)
        .order('price', { ascending: true });

      if (error) throw error;
      setOptions(data || []);
    } catch (error) {
      console.error('Error loading flight options:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate "Best Value" score based on price, duration, and layovers
  const calculateValueScore = (option: FlightOption): number => {
    const prices = options.map(o => o.price);
    const durations = options.map(o => o.total_duration_minutes);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    // Normalize price (0-100, lower is better)
    const priceScore = maxPrice === minPrice ? 100 :
      100 - ((option.price - minPrice) / (maxPrice - minPrice)) * 100;

    // Normalize duration (0-100, lower is better)
    const durationScore = maxDuration === minDuration ? 100 :
      100 - ((option.total_duration_minutes - minDuration) / (maxDuration - minDuration)) * 100;

    // Layover penalty (0 layovers = 100, each layover reduces score)
    const layoverScore = Math.max(0, 100 - (option.layovers * 25));

    // Weighted average based on preference
    switch (scoringPreference) {
      case 'price':
        return (priceScore * 0.8) + (durationScore * 0.1) + (layoverScore * 0.1);
      case 'duration':
        return (priceScore * 0.1) + (durationScore * 0.7) + (layoverScore * 0.2);
      case 'direct':
        return (priceScore * 0.1) + (durationScore * 0.1) + (layoverScore * 0.8);
      case 'balanced':
      default:
        return (priceScore * 0.5) + (durationScore * 0.3) + (layoverScore * 0.2);
    }
  };

  // Find the best value option
  const bestValueOption = options.length > 0 ?
    options.reduce((best, current) =>
      calculateValueScore(current) > calculateValueScore(best) ? current : best
    ) : null;

  const getAirlineName = (code: string): string => {
    const airlines: Record<string, string> = {
      'AA': 'American Airlines',
      'DL': 'Delta Air Lines',
      'UA': 'United Airlines',
      'WN': 'Southwest Airlines',
      'B6': 'JetBlue Airways',
      'AS': 'Alaska Airlines',
      'NK': 'Spirit Airlines',
      'F9': 'Frontier Airlines',
      'G4': 'Allegiant Air',
      'HA': 'Hawaiian Airlines',
      'SY': 'Sun Country Airlines',
      'AC': 'Air Canada',
      'BA': 'British Airways',
      'LH': 'Lufthansa',
      'AF': 'Air France',
      'KL': 'KLM',
      'EK': 'Emirates',
      'QR': 'Qatar Airways',
      'SQ': 'Singapore Airlines',
      'CX': 'Cathay Pacific',
      'NH': 'All Nippon Airways',
      'JL': 'Japan Airlines',
    };
    return airlines[code] || code;
  };

  const generateBookingUrl = (
    origin: string,
    destination: string,
    departureDate: string,
    returnDate: string | null
  ): string => {
    const depDate = new Date(departureDate).toISOString().split('T')[0];
    const retDate = returnDate ? new Date(returnDate).toISOString().split('T')[0] : '';

    return `https://www.kayak.com/flights/${origin}-${destination}/${depDate}${retDate ? `/${retDate}` : ''}?sort=bestflight_a`;
  };

  const handleBookFlight = (option: FlightOption) => {
    let bookingUrl = option.booking_url;

    // If no booking URL exists, generate one from the flight details
    if (!bookingUrl && option.origin_airport && option.destination_airport) {
      bookingUrl = generateBookingUrl(
        option.origin_airport,
        option.destination_airport,
        option.outbound_departure,
        option.return_departure
      );
    }

    // Fallback to generic Kayak if still no URL
    bookingUrl = bookingUrl || 'https://www.kayak.com/flights';

    window.open(bookingUrl, '_blank');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="text-center p-8 text-slate-600">
        No flight options available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">
          {options.length} Flight Options Found
        </h4>
        <div className="flex bg-slate-100 rounded-lg p-1">
          {(['balanced', 'price', 'duration', 'direct'] as const).map((pref) => (
            <button
              key={pref}
              onClick={() => setScoringPreference(pref)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${scoringPreference === pref
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              {pref.charAt(0).toUpperCase() + pref.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {options.map((option) => (
          <div
            key={option.id}
            className={`border rounded-lg p-4 hover:shadow-sm transition-all ${bestValueOption?.id === option.id
              ? 'border-green-400 bg-green-50'
              : 'border-slate-200 hover:border-blue-300'
              }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bestValueOption?.id === option.id ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                  <Plane className={`w-5 h-5 ${bestValueOption?.id === option.id ? 'text-green-600' : 'text-blue-600'
                    }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {option.carriers.map(code => getAirlineName(code)).join(', ')}
                    </span>
                    {bestValueOption?.id === option.id && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-xs font-semibold rounded-full">
                        <Award className="w-3 h-3" />
                        Best Value
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    {option.cabin_class} • {option.layovers === 0 ? 'Nonstop' : `${option.layovers} stop${option.layovers > 1 ? 's' : ''}`}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900">
                  {option.currency === 'USD' ? '$' : option.currency}{option.price.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500">
                  {option.currency}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1">Outbound</div>
                <div className="text-sm text-slate-900">
                  {formatDateTime(option.outbound_departure)} → {formatDateTime(option.outbound_arrival)}
                </div>
              </div>

              {option.return_departure && option.return_arrival && (
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">Return</div>
                  <div className="text-sm text-slate-900">
                    {formatDateTime(option.return_departure)} → {formatDateTime(option.return_arrival)}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <Clock className="w-3 h-3" />
                  <span>{formatDuration(option.total_duration_minutes)}</span>
                </div>

                {option.baggage_included && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                    Baggage Included
                  </span>
                )}

                {option.refundable && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                    Refundable
                  </span>
                )}
              </div>

              <button
                onClick={() => handleBookFlight(option)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Book Flight
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
