export interface Project {
  id: string;
  client_name: string;
  project_location: string | null;
  project_city: string | null;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ProjectRules {
  id: string;
  project_id: string;
  max_flight_price: number;
  max_nightly_rate?: number;
  allowed_airlines: string[];
  preferred_hotel_chains?: string[];
  required_hotel_amenities?: string[];
  max_daily_car_rate?: number;
  preferred_car_agencies?: string[];
  required_car_features?: string[];
  cabin_class: 'economy' | 'business' | 'first';
  advance_booking_days: number;
  requires_approval: boolean;
  pricing_preference: string;
  max_fare_cap: number | null;
  baggage_included_only: boolean;
  refundable_only: boolean;
  advance_purchase_days: number;
  created_at: string;
  updated_at: string;
}

export interface Consultant {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  home_location: string | null;
  base_airport: string | null;
  passport_country: string | null;
  date_of_birth: string | null;
  loyalty_programs: Record<string, string>;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProjectAssignment {
  id: string;
  project_id: string;
  consultant_id: string;
  status: 'pending' | 'confirmed' | 'booked' | 'completed' | 'cancelled';
  travel_from_location: string;
  travel_to_location: string;
  departure_date: string;
  return_date: string | null;
  flight_benchmark_price: number | null;
  hotel_benchmark_price: number | null;
  car_benchmark_price: number | null;
  created_at: string;
  updated_at: string;
  project?: Project;
  consultant?: Consultant;
  flight_searches?: any[];
  hotel_searches?: any[];
  car_searches?: any[];
}

export interface FlightOption {
  id: string;
  search_id: string;
  option_number: number;
  price: number;
  currency: string;
  cabin_class: string;
  carrier: string;
  carriers: string[];
  layovers: number;
  total_duration_minutes: number;
  baggage_included: boolean;
  refundable: boolean;
  outbound_departure: string;
  outbound_arrival: string;
  return_departure: string | null;
  return_arrival: string | null;
  booking_url: string | null;
  offer_id: string | null;
  full_payload: unknown;
  created_at: string;
  origin_airport?: string;
  destination_airport?: string;
}

export interface SupportTicket {
  id: string;
  assignment_id: string | null;
  consultant_id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export interface ReimbursementRequest {
  id: string;
  assignment_id: string;
  amount: number;
  currency: string;
  category: 'flight' | 'hotel' | 'car' | 'other';
  status: 'pending' | 'approved' | 'rejected' | 'capped';
  receipt_url?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FlightSearch {
  id: string;
  assignment_id: string;
  search_params: any;
  executed_at: string;
}

export interface HotelSearch {
  id: string;
  assignment_id: string;
  search_params: any;
  executed_at: string;
}

export interface HotelOption {
  id: string;
  search_id: string;
  hotel_name: string;
  hotel_chain_code?: string;
  city_code: string;
  price_total: number;
  currency: string;
  check_in_date: string;
  check_out_date: string;
  rating?: string;
  amenities?: string[];
  booking_url?: string;
  created_at: string;
}

export interface CarSearch {
  id: string;
  assignment_id: string;
  search_params: any;
  executed_at: string;
}

export interface CarOption {
  id: string;
  search_id: string;
  provider_code: string;
  provider_name: string;
  vehicle_class: string;
  vehicle_description: string;
  price_total: number;
  currency: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_date: string;
  dropoff_date: string;
  image_url?: string;
  booking_url?: string;
  created_at: string;
}
