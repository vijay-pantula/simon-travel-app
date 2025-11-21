import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileContent: (content: string, filename: string) => void;
  accept?: string;
  label: string;
}

export function FileUpload({ onFileContent, accept = '.csv,.xlsx', label }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      onFileContent(text, file.name);
      setStatus('success');
      setMessage(`${file.name} loaded successfully`);
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      setStatus('error');
      setMessage('Failed to read file');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
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
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          id={`file-upload-${label}`}
        />

        <label htmlFor={`file-upload-${label}`} className="cursor-pointer">
          <div className="flex flex-col items-center">
            {status === 'success' ? (
              <CheckCircle className="w-12 h-12 text-green-600 mb-3" />
            ) : status === 'error' ? (
              <AlertCircle className="w-12 h-12 text-red-600 mb-3" />
            ) : (
              <Upload className="w-12 h-12 text-slate-400 mb-3" />
            )}

            <p className="text-sm font-medium text-slate-700 mb-1">
              {status === 'idle' ? 'Drop file here or click to browse' : message}
            </p>
            <p className="text-xs text-slate-500">
              CSV or XLSX files accepted
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
