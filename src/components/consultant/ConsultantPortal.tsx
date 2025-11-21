import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ProjectAssignment, FlightOption, Consultant, ReimbursementRequest } from '../../types';
import { LogOut, Plane, Calendar, MapPin, Receipt, Clock } from 'lucide-react';
import { ReimbursementForm } from '../reimbursement/ReimbursementForm';
import { ReimbursementStatus } from '../reimbursement/ReimbursementStatus';
import { ReimbursementDashboard } from './ReimbursementDashboard';

interface AssignmentWithOptions extends Omit<ProjectAssignment, 'project'> {
  project?: { client_name: string };
  flight_options?: FlightOption[];
  reimbursement_request?: ReimbursementRequest;
}

export function ConsultantPortal() {
  const { user, signOut } = useAuth();
  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithOptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingReimbursementId, setRequestingReimbursementId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assignments' | 'reimbursements'>('assignments');

  useEffect(() => {
    if (user) {
      loadConsultantData();
    }
  }, [user]);

  const loadConsultantData = async () => {
    if (!user) return;

    try {
      const { data: consultantData } = await supabase
        .from('consultants')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (consultantData) {
        setConsultant(consultantData);

        const { data: assignmentsData } = await supabase
          .from('project_assignments')
          .select(`
            *,
            project:projects(client_name)
          `)
          .eq('consultant_id', consultantData.id)
          .order('departure_date', { ascending: true });

        if (assignmentsData) {
          const assignmentsWithOptions = await Promise.all(
            assignmentsData.map(async (assignment) => {
              const { data: searches } = await supabase
                .from('flight_searches')
                .select('id')
                .eq('assignment_id', assignment.id)
                .order('executed_at', { ascending: false })
                .limit(1);

              if (searches && searches.length > 0) {
                const { data: options } = await supabase
                  .from('flight_options')
                  .select('*')
                  .eq('search_id', searches[0].id)
                  .order('price', { ascending: true })
                  .limit(3);

                const { data: reimbursement } = await supabase
                  .from('reimbursement_requests')
                  .select('*')
                  .eq('assignment_id', assignment.id)
                  .maybeSingle();

                return {
                  ...assignment,
                  flight_options: options || [],
                  reimbursement_request: reimbursement || undefined
                };
              }

              const { data: reimbursement } = await supabase
                .from('reimbursement_requests')
                .select('*')
                .eq('assignment_id', assignment.id)
                .maybeSingle();

              return {
                ...assignment,
                flight_options: [],
                reimbursement_request: reimbursement || undefined
              };
            })
          );

          setAssignments(assignmentsWithOptions);
        }
      }
    } catch (error) {
      console.error('Error loading consultant data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Plane className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-slate-600">Loading your travel options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Plane className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  {consultant?.name || 'Consultant Portal'}
                </h1>
                <p className="text-xs text-slate-600">{consultant?.email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('assignments')}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'assignments'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4" />
              Travel Assignments
            </div>
            {activeTab === 'assignments' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('reimbursements')}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === 'reimbursements'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              My Reimbursements
            </div>
            {activeTab === 'reimbursements' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'assignments' && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Your Travel Assignments</h2>
              <p className="text-slate-600 mt-1">{assignments.length} active assignments</p>
            </div>

            {assignments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No travel assignments yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {assignments.map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    isRequesting={requestingReimbursementId === assignment.id}
                    onRequestReimbursement={() => setRequestingReimbursementId(assignment.id)}
                    onCancelRequest={() => setRequestingReimbursementId(null)}
                    onReimbursementSuccess={() => {
                      setRequestingReimbursementId(null);
                      loadConsultantData(); // Reload to show the new request
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'reimbursements' && <ReimbursementDashboard />}
      </div>
    </div>
  );
}

function AssignmentCard({
  assignment,
  onRequestReimbursement,
  isRequesting,
  onCancelRequest,
  onReimbursementSuccess
}: {
  assignment: AssignmentWithOptions;
  onRequestReimbursement: () => void;
  isRequesting: boolean;
  onCancelRequest: () => void;
  onReimbursementSuccess: () => void;
}) {
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getBookingUrl = (option: FlightOption): string => {
    if (option.booking_url) return option.booking_url;
    return 'https://www.kayak.com/flights';
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold mb-2">
              {assignment.project?.client_name || 'Project'}
            </h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {assignment.travel_from_location} → {assignment.travel_to_location}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(assignment.departure_date).toLocaleDateString()}
                {assignment.return_date && ` - ${new Date(assignment.return_date).toLocaleDateString()}`}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${assignment.status === 'booked' ? 'bg-green-500 text-white' :
              assignment.status === 'pending' ? 'bg-yellow-500 text-white' :
                'bg-blue-500 text-white'
              }`}>
              {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Reimbursement Section */}
        {assignment.status === 'booked' && (
          <div className="mb-8 border-b border-slate-100 pb-8">
            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-slate-500" />
              Reimbursement
            </h4>

            {assignment.reimbursement_request ? (
              <ReimbursementStatus request={assignment.reimbursement_request} />
            ) : isRequesting ? (
              <ReimbursementForm
                assignmentId={assignment.id}
                flightBenchmark={assignment.flight_benchmark_price}
                hotelBenchmark={assignment.hotel_benchmark_price}
                carBenchmark={assignment.car_benchmark_price}
                onSuccess={onReimbursementSuccess}
                onCancel={onCancelRequest}
              />
            ) : (
              <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Have you booked your travel?</p>
                  <p className="text-xs text-slate-500">Upload your receipt to request reimbursement.</p>
                </div>
                <button
                  onClick={onRequestReimbursement}
                  className="px-4 py-2 bg-white border border-slate-300 shadow-sm text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Request Reimbursement
                </button>
              </div>
            )}
          </div>
        )}

        {assignment.flight_options && assignment.flight_options.length > 0 ? (
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Flight Options</h4>
            <div className="grid gap-4 md:grid-cols-3">
              {assignment.flight_options.map((option) => (
                <div
                  key={option.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-500">
                      Option {option.option_number}
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      ${option.price}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Plane className="w-4 h-4" />
                      <span className="font-medium">{getAirlineName(option.carrier)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4" />
                      {formatDuration(option.total_duration_minutes)}
                    </div>

                    <div className="text-slate-600">
                      {option.layovers === 0 ? 'Direct' : `${option.layovers} stop${option.layovers > 1 ? 's' : ''}`}
                    </div>

                    <div className="flex gap-2 flex-wrap mt-3">
                      {option.baggage_included && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Baggage
                        </span>
                      )}
                      {option.refundable && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Refundable
                        </span>
                      )}
                    </div>
                  </div>

                  <a
                    href={getBookingUrl(option)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Book Now
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-600">
            <p>Flight options will be sent to you shortly</p>
          </div>
        )}
      </div>
    </div>
  );
}
