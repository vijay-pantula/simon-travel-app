import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ReceiptUploadProps {
    onUploadComplete: (url: string) => void;
    onUploadError: (error: string) => void;
}

export function ReceiptUpload({ onUploadComplete, onUploadError }: ReceiptUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [fileName, setFileName] = useState('');

    const uploadFile = async (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            setStatus('error');
            onUploadError('Only images and PDF files are allowed');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setStatus('error');
            onUploadError('File size must be less than 5MB');
            return;
        }

        setUploading(true);
        setStatus('idle');
        setFileName(file.name);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL (assuming bucket is public or we use signed URLs)
            // For now, we'll use the public URL format, but we might need signed URLs if bucket is private
            // The migration created it as private, so we should probably use createSignedUrl or make it public.
            // Let's use createSignedUrl for better security if it's private, or just store the path.
            // For simplicity in this demo, let's assume we store the path and generate signed URLs on view,
            // OR we just make the bucket public for read. 
            // The migration said: VALUES ('receipts', 'receipts', false) -> private.
            // So we should store the path.

            onUploadComplete(filePath);
            setStatus('success');
        } catch (error) {
            console.error('Upload error:', error);
            setStatus('error');
            onUploadError('Failed to upload receipt');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) uploadFile(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-2">
                Upload Receipt
            </label>

            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all ${isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : status === 'success'
                            ? 'border-green-500 bg-green-50'
                            : status === 'error'
                                ? 'border-red-500 bg-red-50'
                                : 'border-slate-300 hover:border-slate-400'
                    }`}
            >
                <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileInput}
                    className="hidden"
                    id="receipt-upload"
                    disabled={uploading || status === 'success'}
                />

                <label
                    htmlFor="receipt-upload"
                    className={`cursor-pointer ${uploading || status === 'success' ? 'cursor-default' : ''}`}
                >
                    <div className="flex flex-col items-center">
                        {uploading ? (
                            <Loader className="w-10 h-10 text-blue-600 animate-spin mb-3" />
                        ) : status === 'success' ? (
                            <CheckCircle className="w-10 h-10 text-green-600 mb-3" />
                        ) : status === 'error' ? (
                            <AlertCircle className="w-10 h-10 text-red-600 mb-3" />
                        ) : (
                            <Upload className="w-10 h-10 text-slate-400 mb-3" />
                        )}

                        <p className="text-sm font-medium text-slate-700 mb-1">
                            {uploading ? 'Uploading...' :
                                status === 'success' ? fileName :
                                    status === 'error' ? 'Upload failed' :
                                        'Drop receipt here or click to browse'}
                        </p>

                        {!uploading && status !== 'success' && (
                            <p className="text-xs text-slate-500">
                                Images or PDF (max 5MB)
                            </p>
                        )}

                        {status === 'success' && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setStatus('idle');
                                    setFileName('');
                                    onUploadComplete(''); // Clear the value
                                }}
                                className="mt-2 text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                            >
                                <X className="w-3 h-3" /> Remove
                            </button>
                        )}
                    </div>
                </label>
            </div>
        </div>
    );
}
