export const extractAirportCode = (location: string): string => {
    const cityToAirportMap: Record<string, string> = {
        'Tampa': 'TPA',
        'Tampa, FL': 'TPA',
        'New York': 'JFK',
        'New York, NY': 'JFK',
        'Los Angeles': 'LAX',
        'Los Angeles, CA': 'LAX',
        'Chicago': 'ORD',
        'Chicago, IL': 'ORD',
        'Miami': 'MIA',
        'Miami, FL': 'MIA',
        'San Francisco': 'SFO',
        'San Francisco, CA': 'SFO',
        'Boston': 'BOS',
        'Boston, MA': 'BOS',
        'Seattle': 'SEA',
        'Seattle, WA': 'SEA',
        'Atlanta': 'ATL',
        'Atlanta, GA': 'ATL',
        'Dallas': 'DFW',
        'Dallas, TX': 'DFW',
        'Houston': 'IAH',
        'Houston, TX': 'IAH',
        'Denver': 'DEN',
        'Denver, CO': 'DEN',
        'Phoenix': 'PHX',
        'Phoenix, AZ': 'PHX',
        'Las Vegas': 'LAS',
        'Las Vegas, NV': 'LAS',
        'Orlando': 'MCO',
        'Orlando, FL': 'MCO',
        'India': 'DEL', // Default to New Delhi for country-level search
        'UK': 'LHR',    // Default to London for UK
        'United Kingdom': 'LHR',
    };

    const normalized = location.trim();
    if (cityToAirportMap[normalized]) {
        return cityToAirportMap[normalized];
    }

    const match = location.match(/\b[A-Z]{3}\b/);
    if (match) {
        return match[0];
    }

    for (const city in cityToAirportMap) {
        if (normalized.toLowerCase().includes(city.toLowerCase())) {
            return cityToAirportMap[city];
        }
    }

    return location.substring(0, 3).toUpperCase();
};
