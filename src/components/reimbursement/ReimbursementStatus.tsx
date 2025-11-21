import { CheckCircle, Clock, XCircle, AlertTriangle, FileText } from 'lucide-react';
import { ReimbursementRequest } from '../../types';

interface ReimbursementStatusProps {
    request: ReimbursementRequest;
}

export function ReimbursementStatus({ request }: ReimbursementStatusProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-green-600 bg-green-50 border-green-200';
            case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
            case 'capped': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default: return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle className="w-5 h-5" />;
            case 'rejected': return <XCircle className="w-5 h-5" />;
            case 'capped': return <AlertTriangle className="w-5 h-5" />;
            default: return <Clock className="w-5 h-5" />;
        }
    };

    return (
        <div className={`rounded-lg border p-4 ${getStatusColor(request.status)}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    {getStatusIcon(request.status)}
                    <div>
                        <p className="font-medium capitalize">{request.status} Reimbursement</p>
                        <p className="text-sm opacity-90">
                            {request.currency} {request.amount.toFixed(2)}
                        </p>
                    </div>
                </div>
                {request.receipt_url && (
                    <a
                        href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/receipts/${request.receipt_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-medium underline opacity-80 hover:opacity-100"
                    >
                        <FileText className="w-3 h-3" />
                        View Receipt
                    </a>
                )}
            </div>

            <div className="flex items-center justify-between mb-2">
                <span className="text-sm opacity-80">Category</span>
                <span className="font-medium capitalize">
                    {request.category || 'Other'}
                </span>
            </div>

            {request.admin_notes && (
                <div className="mt-3 pt-3 border-t border-current border-opacity-20 text-sm">
                    <span className="font-medium">Admin Note:</span> {request.admin_notes}
                </div>
            )}
        </div>
    );
}
