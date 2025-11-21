import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, AlertTriangle, FileText, DollarSign } from 'lucide-react';

interface ReimbursementRequestWithDetails {
    id: string;
    amount: number;
    currency: string;
    category: 'flight' | 'hotel' | 'car' | 'other';
    status: 'pending' | 'approved' | 'rejected' | 'capped';
    receipt_url?: string;
    created_at: string;
    assignment: {
        id: string;
        flight_benchmark_price: number | null;
        hotel_benchmark_price: number | null;
        car_benchmark_price: number | null;
        project: {
            client_name: string;
        };
        consultant: {
            name: string;
            email: string;
        };
    };
}

export function ReimbursementApprovalDashboard() {
    const [requests, setRequests] = useState<ReimbursementRequestWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reimbursement_requests')
                .select(`
          *,
          assignment:project_assignments(
            id,
            flight_benchmark_price,
            hotel_benchmark_price,
            car_benchmark_price,
            project:projects(client_name),
            consultant:consultants(name, email)
          )
        `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (err) {
            console.error('Error loading reimbursement requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const sendEmail = async (request: ReimbursementRequestWithDetails, status: 'approved' | 'rejected', adminNotes?: string) => {
        try {
            const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-reimbursement-email`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: request.assignment.consultant?.email,
                    consultantName: request.assignment.consultant?.name,
                    status,
                    amount: request.amount,
                    currency: request.currency,
                    category: request.category,
                    projectName: request.assignment.project?.client_name,
                    adminNotes,
                }),
            });

            if (!response.ok) {
                console.error('Failed to send email notification');
            }
        } catch (error) {
            console.error('Error sending email:', error);
            // Don't fail the approval/rejection if email fails
        }
    };

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            const request = requests.find(r => r.id === id);
            if (!request) return;

            const { error } = await supabase
                .from('reimbursement_requests')
                .update({ status: 'approved' })
                .eq('id', id);

            if (error) throw error;

            // Send email notification
            await sendEmail(request, 'approved');

            // Remove from list
            setRequests(requests.filter(r => r.id !== id));
        } catch (err) {
            console.error('Error approving request:', err);
            alert('Failed to approve request');
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectModal = (id: string) => {
        setSelectedRequestId(id);
        setRejectReason('');
        setRejectModalOpen(true);
    };

    const handleReject = async () => {
        if (!selectedRequestId) return;

        setProcessingId(selectedRequestId);
        try {
            const request = requests.find(r => r.id === selectedRequestId);
            if (!request) return;

            const { error } = await supabase
                .from('reimbursement_requests')
                .update({
                    status: 'rejected',
                    admin_notes: rejectReason
                })
                .eq('id', selectedRequestId);

            if (error) throw error;

            // Send email notification
            await sendEmail(request, 'rejected', rejectReason);

            // Remove from list
            setRequests(requests.filter(r => r.id !== selectedRequestId));
            setRejectModalOpen(false);
        } catch (err) {
            console.error('Error rejecting request:', err);
            alert('Failed to reject request');
        } finally {
            setProcessingId(null);
            setSelectedRequestId(null);
        }
    };

    const getBenchmark = (request: ReimbursementRequestWithDetails) => {
        switch (request.category) {
            case 'flight': return request.assignment.flight_benchmark_price;
            case 'hotel': return request.assignment.hotel_benchmark_price;
            case 'car': return request.assignment.car_benchmark_price;
            default: return null;
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading requests...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Reimbursement Approvals</h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {requests.length} Pending
                </span>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">All Caught Up!</h3>
                    <p className="text-slate-500 mt-1">No pending reimbursement requests.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Consultant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Benchmark</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Receipt</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {requests.map((request) => {
                                const benchmark = getBenchmark(request);
                                const isOverBenchmark = benchmark && request.amount > benchmark;

                                return (
                                    <tr key={request.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{request.assignment.consultant?.name || 'Unknown'}</div>
                                            <div className="text-xs text-slate-500">{request.assignment.project?.client_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${request.category === 'flight' ? 'bg-blue-100 text-blue-800' :
                                                    request.category === 'hotel' ? 'bg-indigo-100 text-indigo-800' :
                                                        request.category === 'car' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-slate-100 text-slate-800'}`}>
                                                {request.category.charAt(0).toUpperCase() + request.category.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm font-medium text-slate-900">
                                                <DollarSign className="w-4 h-4 text-slate-400 mr-1" />
                                                {request.amount.toFixed(2)} {request.currency}
                                            </div>
                                            {isOverBenchmark && (
                                                <div className="flex items-center text-xs text-amber-600 mt-1">
                                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                                    Over Limit
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {benchmark ? `$${benchmark.toFixed(2)}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {request.receipt_url ? (
                                                <a
                                                    href={request.receipt_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-900 flex items-center text-sm"
                                                >
                                                    <FileText className="w-4 h-4 mr-1" />
                                                    View
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 text-sm">No Receipt</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleApprove(request.id)}
                                                    disabled={!!processingId}
                                                    className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                                                    title="Approve"
                                                >
                                                    <Check className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => openRejectModal(request.id)}
                                                    disabled={!!processingId}
                                                    className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                                                    title="Reject"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Reject Reimbursement</h3>
                        <p className="text-sm text-slate-600 mb-4">
                            Please provide a reason for rejecting this request. The consultant will be notified.
                        </p>
                        <textarea
                            className="w-full border border-slate-300 rounded-md p-2 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={4}
                            placeholder="Reason for rejection..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setRejectModalOpen(false)}
                                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectReason.trim() || !!processingId}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {processingId ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
