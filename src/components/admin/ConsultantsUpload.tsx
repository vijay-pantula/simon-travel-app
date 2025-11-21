import { useState, useEffect } from 'react';
import { FileUpload } from '../FileUpload';
import { parseCSV, csvToObjects, validateConsultantRow, ConsultantCSVRow } from '../../utils/csvParser';
import { supabase } from '../../lib/supabase';
import { Project } from '../../types';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export function ConsultantsUpload() {
  const [consultants, setConsultants] = useState<ConsultantCSVRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [autoAssign, setAutoAssign] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .order('client_name');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleFileContent = (content: string, filename: string) => {
    const parsed = parseCSV(content);
    const objects = csvToObjects<Record<string, string>>(parsed);
    const validated = objects.map(validateConsultantRow).filter((c): c is ConsultantCSVRow => c !== null);

    setConsultants(validated);
    setResult(null);
  };

  const handleUpload = async () => {
    if (consultants.length === 0) return;
    if (autoAssign && !selectedProjectId) {
      alert('Please select a project for auto-assignment');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase
        .from('consultants')
        .insert(consultants.map(c => ({
          name: c.name,
          email: c.email,
          home_location: c.home_location || null,
          base_airport: c.base_airport || null,
          passport_country: c.passport_country || null,
          date_of_birth: c.date_of_birth || null,
          loyalty_programs: {},
          preferences: {}
        })))
        .select();

      if (error) throw error;

      const insertedCount = data?.length || 0;

      if (autoAssign && selectedProjectId && data) {
        const selectedProject = projects.find(p => p.id === selectedProjectId);

        const assignments = data.map(consultant => ({
          project_id: selectedProjectId,
          consultant_id: consultant.id,
          travel_from_location: consultant.base_airport || consultant.home_location || '',
          travel_to_location: selectedProject?.project_city || '',
          departure_date: selectedProject?.start_date || new Date().toISOString().split('T')[0],
          return_date: null,
          status: 'pending'
        }));

        const { error: assignError } = await supabase
          .from('project_assignments')
          .insert(assignments);

        if (assignError) {
          console.error('Error creating assignments:', assignError);
        }
      }

      await supabase.from('audit_logs').insert({
        action: 'consultants_bulk_upload',
        entity_type: 'consultant',
        details: {
          count: insertedCount,
          auto_assigned: autoAssign,
          project_id: autoAssign ? selectedProjectId : null
        }
      });

      setResult({ success: insertedCount, errors: [] });
      setConsultants([]);
      setAutoAssign(false);
      setSelectedProjectId('');
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
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Upload Consultants</h2>

      <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">CSV Format Example:</h3>
        <pre className="text-xs text-slate-700 font-mono overflow-x-auto">
name,email,home_location,base_airport,passport_country,date_of_birth{'\n'}
John Doe,john.doe@example.com,New York NY,JFK,United States,1990-05-15{'\n'}
Jane Smith,jane.smith@example.com,Los Angeles CA,LAX,United States,1985-08-22{'\n'}
Bob Johnson,bob.j@example.com,Chicago IL,ORD,United States,1992-03-10
        </pre>
        <p className="text-xs text-slate-600 mt-2">
          <strong>Required fields:</strong> name, email<br/>
          <strong>Optional fields:</strong> home_location, base_airport (3-letter code), passport_country, date_of_birth (YYYY-MM-DD)
        </p>
      </div>

      <FileUpload
        label="Consultants CSV File"
        accept=".csv"
        onFileContent={handleFileContent}
      />

      {!loadingProjects && projects.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={autoAssign}
              onChange={(e) => setAutoAssign(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-blue-900">
              Automatically assign all consultants to a project after upload
            </span>
          </label>
          {autoAssign && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.client_name} - {project.project_city || 'No city'} ({new Date(project.start_date).toLocaleDateString()})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {consultants.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">
              {consultants.length} consultant{consultants.length !== 1 ? 's' : ''} ready to upload
            </p>
            <button
              onClick={handleUpload}
              disabled={loading || (autoAssign && !selectedProjectId)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  {autoAssign ? 'Uploading & Assigning...' : 'Uploading...'}
                </span>
              ) : (
                autoAssign ? 'Upload & Assign Consultants' : 'Upload Consultants'
              )}
            </button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">Home Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700">Base Airport</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {consultants.map((consultant, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm text-slate-900">{consultant.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{consultant.email}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{consultant.home_location || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{consultant.base_airport || '-'}</td>
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
                  {result.success} consultant{result.success !== 1 ? 's' : ''} uploaded successfully
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
