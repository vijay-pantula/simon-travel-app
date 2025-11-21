import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { DollarSign, CheckCircle, XCircle, Clock, FileText, AlertCircle } from 'lucide-react';

interface ReimbursementWithAssignment {
    id: string;
    amount: number;
    currency: string;
    category: 'flight' | 'hotel' | 'car' | 'other';
    status: 'pending' | 'approved' | 'rejected' | 'capped';
    receipt_url?: string;
    admin_notes?: string;
    created_at: string;
    updated_at: string;
    assignment: {
        project: {
            client_name: string;
        };
    };
}

export function ReimbursementDashboard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<ReimbursementWithAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    useEffect(() => {
        loadRequests();
    }, [user]);

    const loadRequests = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // First get consultant ID
            const { data: consultant } = await supabase
                .from('consultants')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!consultant) return;

            // Get all assignments for this consultant
            const { data: assignments } = await supabase
                .from('project_assignments')
                .select('id')
                .eq('consultant_id', consultant.id);

            if (!assignments || assignments.length === 0) {
                setRequests([]);
                return;
            }

            const assignmentIds = assignments.map(a => a.id);

            // Get reimbursement requests
            const { data, error } = await supabase
                .from('reimbursement_requests')
                .select(`
          *,
          assignment:project_assignments(
            project:projects(client_name)
          )
        `)
                .in('assignment_id', assignmentIds)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (err) {
            console.error('Error loading reimbursement requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredRequests = requests.filter(req => {
        if (activeFilter === 'all') return true;
        return req.status === activeFilter;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'rejected': return <XCircle className="w-5 h-5 text-red-600" />;
            case 'pending': return <Clock className="w-5 h-5 text-yellow-600" />;
            default: return <AlertCircle className="w-5 h-5 text-slate-600" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
        switch (status) {
            case 'approved': return `${baseClasses} bg-green-100 text-green-800`;
            case 'rejected': return `${baseClasses} bg-red-100 text-red-800`;
            case 'pending': return `${baseClasses} bg-yellow-100 text-yellow-800`;
            case 'capped': return `${baseClasses} bg-blue-100 text-blue-800`;
            default: return `${baseClasses} bg-slate-100 text-slate-800`;
        }
    };

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading your reimbursements...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">My Reimbursements</h2>
                <p className="text-sm text-slate-600 mt-1">Track and manage your expense reimbursement requests</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Total Requests</p>
                            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-slate-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Approved</p>
                            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Rejected</p>
                            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                        </div>
                        <XCircle className="w-8 h-8 text-red-400" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === filter
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            {filteredRequests.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No Requests Found</h3>
                    <p className="text-slate-500 mt-1">
                        {activeFilter === 'all'
                            ? 'You haven\'t submitted any reimbursement requests yet.'
                            : `No ${activeFilter} requests.`}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="divide-y divide-slate-200">
                        {filteredRequests.map((request) => (
                            <div key={request.id} className="p-6 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {getStatusIcon(request.status)}
                                            <h3 className="text-lg font-semibold text-slate-900">
                                                {request.assignment.project?.client_name || 'Unknown Project'}
                                            </h3>
                                            <span className={getStatusBadge(request.status)}>
                                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                            </span>
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                                                {request.category.charAt(0).toUpperCase() + request.category.slice(1)}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                            <div>
                                                <p className="text-xs text-slate-500">Amount</p>
                                                <p className="text-sm font-medium text-slate-900">
                                                    {request.currency} {request.amount.toFixed(2)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Submitted</p>
                                                <p className="text-sm font-medium text-slate-900">
                                                    {new Date(request.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500">Receipt</p>
                                                {request.receipt_url ? (
                                                    <a
                                                        href={request.receipt_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                        View
                                                    </a>
                                                ) : (
                                                    <p className="text-sm text-slate-400">No receipt</p>
                                                )}
                                            </div>
                                        </div>

                                        {request.status === 'rejected' && request.admin_notes && (
                                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-xs font-medium text-red-800 mb-1">Rejection Reason:</p>
                                                <p className="text-sm text-red-700">{request.admin_notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
