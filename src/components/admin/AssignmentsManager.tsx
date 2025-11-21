import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ProjectAssignment, FlightSearch, FlightOption, HotelSearch, HotelOption, CarSearch, CarOption } from '../../types';
import { FlightSearchPanel } from './FlightSearchPanel';
import { FlightOptionsDisplay } from './FlightOptionsDisplay';
import { HotelSearchPanel } from './HotelSearchPanel';
import { HotelOptionsDisplay } from './HotelOptionsDisplay';
import { CarSearchPanel } from './CarSearchPanel';
import { CarOptionsDisplay } from './CarOptionsDisplay';
import { ChevronDown, ChevronUp, Plane, Hotel, Car, Calendar, MapPin } from 'lucide-react';

interface AssignmentWithDetails extends Omit<ProjectAssignment, 'project' | 'consultant'> {
  project?: { client_name: string; project_city: string };
  consultant?: { name: string; email: string };
  flight_searches: (FlightSearch & { flight_options: FlightOption[] })[];
  hotel_searches: (HotelSearch & { hotel_options: HotelOption[] })[];
  car_searches: (CarSearch & { car_options: CarOption[] })[];
}

export function AssignmentsManager() {
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'flight' | 'hotel' | 'car'>('flight');

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('project_assignments')
        .select(`
          *,
          project:projects(client_name, project_city),
          consultant:consultants(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Hybrid approach: Fetch flights directly (PostgREST works for this table)
      // Fetch hotel/car via Edge Function (PostgREST schema cache issue)
      const assignmentsWithSearches = await Promise.all((data || []).map(async (assignment) => {
        // Fetch flight searches directly (this works)
        const { data: flightSearches } = await supabase
          .from('flight_searches')
          .select('*, flight_options(*)')
          .eq('assignment_id', assignment.id);

        // Fetch hotel and car searches via Edge Function (bypasses schema cache)
        const { data: searches, error: searchError } = await supabase.functions.invoke('get-assignment-searches', {
          body: { assignmentId: assignment.id }
        });

        if (searchError) {
          console.error('Error fetching hotel/car searches for assignment:', assignment.id, searchError);
        }

        return {
          ...assignment,
          flight_searches: flightSearches || [],
          hotel_searches: searches?.hotel_searches || [],
          car_searches: searches?.car_searches || []
        };
      }));

      setAssignments(assignmentsWithSearches);
    } catch (err) {
      console.error('Error loading assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    setActiveTab('flight'); // Reset tab when expanding
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 flex items-center justify-center">
        <Plane className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900">Travel Assignments</h2>
        <p className="text-sm text-slate-600 mt-1">{assignments.length} total assignments</p>
      </div>

      {assignments.length === 0 ? (
        <div className="p-12 text-center">
          <Plane className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No assignments yet</p>
          <p className="text-sm text-slate-500 mt-1">Create assignments using the "Assign to Project" tab</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {assignments.map((assignment) => {
            const isExpanded = expandedId === assignment.id;

            return (
              <div key={assignment.id} className="hover:bg-slate-50 transition-colors">
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => toggleExpand(assignment.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {assignment.project?.client_name || 'Unknown Project'}
                        </h3>
                        <span className={`px - 2 py - 1 text - xs font - medium rounded - full ${assignment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : assignment.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : assignment.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          } `}>
                          {assignment.status}
                        </span>
                        {assignment.flight_searches?.[0]?.flight_options?.length > 0 && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {assignment.flight_searches[0].flight_options.length} flights
                          </span>
                        )}
                        {assignment.hotel_searches?.[0]?.hotel_options?.length > 0 && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                            {assignment.hotel_searches[0].hotel_options.length} hotels
                          </span>
                        )}
                        {assignment.car_searches?.[0]?.car_options?.length > 0 && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            {assignment.car_searches[0].car_options.length} cars
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Plane className="w-4 h-4" />
                          <span>{assignment.consultant?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin className="w-4 h-4" />
                          <span>{assignment.travel_from_location} → {assignment.travel_to_location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(assignment.departure_date).toLocaleDateString()}
                            {assignment.return_date && ` - ${new Date(assignment.return_date).toLocaleDateString()} `}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button className="ml-4 p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-slate-100">
                    <div className="flex gap-4 mt-4 border-b border-slate-200">
                      <button
                        className={`pb - 2 px - 4 text - sm font - medium transition - colors relative ${activeTab === 'flight'
                          ? 'text-blue-600'
                          : 'text-slate-500 hover:text-slate-700'
                          } `}
                        onClick={() => setActiveTab('flight')}
                      >
                        <div className="flex items-center gap-2">
                          <Plane className="w-4 h-4" />
                          Flight Search
                        </div>
                        {activeTab === 'flight' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                        )}
                      </button>
                      <button
                        className={`pb - 2 px - 4 text - sm font - medium transition - colors relative ${activeTab === 'hotel'
                          ? 'text-blue-600'
                          : 'text-slate-500 hover:text-slate-700'
                          } `}
                        onClick={() => setActiveTab('hotel')}
                      >
                        <div className="flex items-center gap-2">
                          <Hotel className="w-4 h-4" />
                          Hotel Search
                        </div>
                        {activeTab === 'hotel' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                        )}
                      </button>
                      <button
                        className={`pb - 2 px - 4 text - sm font - medium transition - colors relative ${activeTab === 'car'
                          ? 'text-blue-600'
                          : 'text-slate-500 hover:text-slate-700'
                          } `}
                        onClick={() => setActiveTab('car')}
                      >
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4" />
                          Car Search
                        </div>
                        {activeTab === 'car' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                        )}
                      </button>
                    </div>

                    <div className="mt-4">
                      {activeTab === 'flight' && (
                        <>
                          <FlightSearchPanel
                            assignmentId={assignment.id}
                            onSearchComplete={loadAssignments}
                          />
                          {assignment.flight_searches?.[0]?.flight_options && assignment.flight_searches[0].flight_options.length > 0 && (
                            <div className="mt-4">
                              <FlightOptionsDisplay options={assignment.flight_searches[0].flight_options} />
                            </div>
                          )}
                        </>
                      )}

                      {activeTab === 'hotel' && (
                        <>
                          <HotelSearchPanel
                            assignmentId={assignment.id}
                            onSearchComplete={loadAssignments}
                          />
                          {assignment.hotel_searches?.[0]?.hotel_options && assignment.hotel_searches[0].hotel_options.length > 0 && (
                            <div className="mt-4">
                              <HotelOptionsDisplay options={assignment.hotel_searches[0].hotel_options} />
                            </div>
                          )}
                        </>
                      )}

                      {activeTab === 'car' && (
                        <>
                          <CarSearchPanel
                            assignmentId={assignment.id}
                            onSearchComplete={loadAssignments}
                          />
                          {assignment.car_searches?.[0]?.car_options && assignment.car_searches[0].car_options.length > 0 && (
                            <div className="mt-4">
                              <CarOptionsDisplay options={assignment.car_searches[0].car_options} />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
