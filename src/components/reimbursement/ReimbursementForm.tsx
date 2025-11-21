import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ReceiptUpload } from './ReceiptUpload';
import { DollarSign, AlertTriangle, CheckCircle, Loader } from 'lucide-react';

interface ReimbursementFormProps {
    assignmentId: string;
    flightBenchmark: number | null;
    hotelBenchmark: number | null;
    carBenchmark: number | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export function ReimbursementForm({ assignmentId, flightBenchmark, hotelBenchmark, carBenchmark, onSuccess, onCancel }: ReimbursementFormProps) {
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [category, setCategory] = useState<'flight' | 'hotel' | 'car' | 'other'>('flight');
    const [receiptPath, setReceiptPath] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!amount || isNaN(parseFloat(amount))) {
            setError('Please enter a valid amount');
            return;
        }

        if (!receiptPath) {
            setError('Please upload a receipt');
            return;
        }

        setSubmitting(true);

        try {
            const { error: submitError } = await supabase
                .from('reimbursement_requests')
                .insert({
                    assignment_id: assignmentId,
                    amount: parseFloat(amount),
                    currency,
                    category,
                    receipt_url: receiptPath,
                    status: 'pending'
                });

            if (submitError) throw submitError;

            onSuccess();
        } catch (err) {
            console.error('Reimbursement submission error:', err);
            setError('Failed to submit reimbursement request');
        } finally {
            setSubmitting(false);
        }
    };

    const benchmarkPrice =
        category === 'flight' ? flightBenchmark :
            category === 'hotel' ? hotelBenchmark :
                category === 'car' ? carBenchmark : null;

    const isOverBenchmark = benchmarkPrice && amount && parseFloat(amount) > benchmarkPrice;

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Request Reimbursement</h3>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Category
                    </label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="block w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="flight">Flight</option>
                        <option value="hotel">Hotel</option>
                        <option value="car">Car Rental</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Amount Paid
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="block w-full pl-10 pr-12 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                            required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center">
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-slate-500 sm:text-sm rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option>USD</option>
                                <option>EUR</option>
                                <option>GBP</option>
                            </select>
                        </div>
                    </div>
                </div>

                {isOverBenchmark && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                            <p className="font-medium">Price Alert</p>
                            <p>
                                This amount exceeds the {category} benchmark price of ${benchmarkPrice.toFixed(2)}.
                                Your reimbursement may be capped or require additional approval.
                            </p>
                        </div>
                    </div>
                )}

                <ReceiptUpload
                    onUploadComplete={setReceiptPath}
                    onUploadError={setError}
                />

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Submit Request
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
