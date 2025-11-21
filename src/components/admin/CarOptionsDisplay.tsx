import { CarOption } from '../../types';
import { Car, Check, ExternalLink } from 'lucide-react';

interface CarOptionsDisplayProps {
    options: CarOption[];
}

export function CarOptionsDisplay({ options }: CarOptionsDisplayProps) {
    if (!options || options.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
                No car rental options found. Try running a search.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {options.map((option) => (
                <div key={option.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                                <Car className="w-8 h-8 text-slate-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900">{option.vehicle_description}</h4>
                                <p className="text-sm text-slate-600">{option.vehicle_class} • {option.provider_name}</p>
                                <div className="flex gap-2 mt-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                        <Check className="w-3 h-3" />
                                        Unlimited Mileage
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-slate-900">
                                {option.currency} {option.price_total.toFixed(2)}
                            </div>
                            <p className="text-xs text-slate-500 mb-3">Total for trip</p>
                            <a
                                href={option.booking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                View Deal
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
