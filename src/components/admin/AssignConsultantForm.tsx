import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Project, Consultant } from '../../types';
import { UserPlus, Loader, CheckCircle, XCircle, Calendar, MapPin } from 'lucide-react';

export function AssignConsultantForm() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const [formData, setFormData] = useState({
    project_id: '',
    consultant_id: '',
    travel_from_location: '',
    travel_to_location: '',
    departure_date: '',
    return_date: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [projectsRes, consultantsRes] = await Promise.all([
        supabase.from('projects').select('*').eq('status', 'active').order('client_name'),
        supabase.from('consultants').select('*').order('name')
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (consultantsRes.error) throw consultantsRes.error;

      setProjects(projectsRes.data || []);
      setConsultants(consultantsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase
        .from('project_assignments')
        .insert([{
          project_id: formData.project_id,
          consultant_id: formData.consultant_id,
          travel_from_location: formData.travel_from_location,
          travel_to_location: formData.travel_to_location,
          departure_date: formData.departure_date,
          return_date: formData.return_date || null,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'consultant_assigned',
        entity_type: 'assignment',
        entity_id: data.id,
        project_id: formData.project_id,
        consultant_id: formData.consultant_id,
        details: {
          departure_date: formData.departure_date,
          return_date: formData.return_date
        }
      });

      setResult({ success: true, message: 'Consultant assigned to project successfully!' });
      setFormData({
        project_id: '',
        consultant_id: '',
        travel_from_location: '',
        travel_to_location: '',
        departure_date: '',
        return_date: ''
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to assign consultant'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find(p => p.id === formData.project_id);
  const selectedConsultant = consultants.find(c => c.id === formData.consultant_id);

  useEffect(() => {
    if (selectedProject && !formData.travel_to_location) {
      setFormData(prev => ({
        ...prev,
        travel_to_location: selectedProject.project_city || ''
      }));
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedConsultant && !formData.travel_from_location) {
      setFormData(prev => ({
        ...prev,
        travel_from_location: selectedConsultant.base_airport || selectedConsultant.home_location || ''
      }));
    }
  }, [selectedConsultant]);

  if (loadingData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 flex items-center justify-center">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <UserPlus className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-slate-900">Assign Consultant to Project</h2>
      </div>

      {projects.length === 0 || consultants.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-lg">
          <p className="text-slate-600">
            {projects.length === 0 && consultants.length === 0
              ? 'Please create projects and consultants first'
              : projects.length === 0
              ? 'Please create at least one active project first'
              : 'Please create at least one consultant first'}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Project *
              </label>
              <select
                required
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.client_name} ({project.project_city || 'No city'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Consultant *
              </label>
              <select
                required
                value={formData.consultant_id}
                onChange={(e) => setFormData({ ...formData, consultant_id: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a consultant</option>
                {consultants.map((consultant) => (
                  <option key={consultant.id} value={consultant.id}>
                    {consultant.name} ({consultant.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Travel From (Airport/City) *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.travel_from_location}
                  onChange={(e) => setFormData({ ...formData, travel_from_location: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="JFK or New York"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Travel To (Airport/City) *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.travel_to_location}
                  onChange={(e) => setFormData({ ...formData, travel_to_location: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="LAX or Los Angeles"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Departure Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={formData.departure_date}
                  onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Return Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={formData.return_date}
                  onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {selectedProject && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Project Details:</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Client:</strong> {selectedProject.client_name}</p>
                <p><strong>Location:</strong> {selectedProject.project_location || 'Not specified'}</p>
                <p><strong>City:</strong> {selectedProject.project_city || 'Not specified'}</p>
                <p><strong>Duration:</strong> {new Date(selectedProject.start_date).toLocaleDateString()} - {new Date(selectedProject.end_date).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Assigning Consultant...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Assign Consultant
              </>
            )}
          </button>
        </form>
      )}

      {result && (
        <div className={`mt-4 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={`font-medium ${result.success ? 'text-green-900' : 'text-red-900'}`}>
              {result.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
