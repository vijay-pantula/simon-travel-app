import { useState } from 'react';
import { FileUpload } from '../FileUpload';
import { parseCSV, csvToObjects, validateProjectRow, ProjectCSVRow } from '../../utils/csvParser';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export function ProjectsUpload() {
  const [projects, setProjects] = useState<ProjectCSVRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);

  const handleFileContent = (content: string, filename: string) => {
    const parsed = parseCSV(content);
    const objects = csvToObjects<Record<string, string>>(parsed);
    const validated = objects.map(validateProjectRow).filter((p): p is ProjectCSVRow => p !== null);

    setProjects(validated);
    setResult(null);
  };

  const handleUpload = async () => {
    if (projects.length === 0) return;

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert(projects.map(p => ({
          client_name: p.client_name,
          project_location: p.project_location,
          project_city: p.project_city,
          start_date: p.start_date,
          end_date: p.end_date,
          status: 'active'
        })))
        .select();

      if (error) throw error;

      const insertedCount = data?.length || 0;

      for (const project of data || []) {
        await supabase.from('project_rules').insert({
          project_id: project.id,
          routing_preference: 'prefer_direct',
          allow_one_stop: true,
          exclude_red_eyes: true,
          max_connections: 1,
          pricing_preference: 'cheapest',
          cabin_class: 'economy'
        });
      }

      await supabase.from('audit_logs').insert({
        action: 'projects_bulk_upload',
        entity_type: 'project',
        details: { count: insertedCount }
      });

      setResult({ success: insertedCount, errors: [] });
      setProjects([]);
    } catch (error) {
      setResult({
        success: 0,
        errors: [error instanceof Error ? error.message : 'Upload failed']
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Upload Projects</h2>

      <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">CSV Format Example:</h3>
        <pre className="text-xs text-slate-700 font-mono overflow-x-auto">
client_name,project_location,project_city,start_date,end_date{'\n'}
Acme Corporation,"123 Business St, New York, NY 10001",New York,2024-01-15,2024-12-31{'\n'}
Tech Solutions Inc,"456 Tech Blvd, San Francisco, CA 94105",San Francisco,2024-02-01,2024-06-30{'\n'}
Global Enterprises,"789 Global Ave, Chicago, IL 60601",Chicago,2024-03-10,2024-09-15
        </pre>
        <p className="text-xs text-slate-600 mt-2">
          <strong>Required fields:</strong> client_name, project_location (full address), project_city (for flight search), start_date (YYYY-MM-DD), end_date (YYYY-MM-DD)
        </p>
      </div>

      <FileUpload
        label="Projects CSV File"
        accept=".csv"
        onFileContent={handleFileContent}
      />

      {projects.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">
              {projects.length} project{projects.length !== 1 ? 's' : ''} ready to upload
            </p>
            <button
              onClick={handleUpload}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Uploading...
                </span>
              ) : (
                'Upload Projects'
              )}
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">Client Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">City</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">Start Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">End Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {projects.map((project, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm text-slate-900">{project.client_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{project.project_location}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{project.project_city}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{project.start_date}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{project.end_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className={`mt-6 p-4 rounded-lg ${result.errors.length > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          <div className="flex items-start gap-3">
            {result.errors.length > 0 ? (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`font-medium ${result.errors.length > 0 ? 'text-red-900' : 'text-green-900'}`}>
                {result.errors.length > 0 ? 'Upload Failed' : 'Upload Successful'}
              </p>
              {result.success > 0 && (
                <p className="text-sm text-green-700 mt-1">
                  {result.success} project{result.success !== 1 ? 's' : ''} uploaded successfully
                </p>
              )}
              {result.errors.map((error, idx) => (
                <p key={idx} className="text-sm text-red-700 mt-1">{error}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
