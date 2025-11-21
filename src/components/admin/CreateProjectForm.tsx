import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, Calendar, Loader, CheckCircle, XCircle } from 'lucide-react';

export function CreateProjectForm() {
  const [formData, setFormData] = useState({
    client_name: '',
    project_location: '',
    project_city: '',
    start_date: '',
    end_date: '',
    status: 'active' as const
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const { data: project, error } = await supabase
        .from('projects')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      await supabase.from('project_rules').insert({
        project_id: project.id,
        routing_preference: 'prefer_direct',
        allow_one_stop: true,
        exclude_red_eyes: true,
        max_connections: 1,
        pricing_preference: 'cheapest',
        cabin_class: 'economy'
      });

      await supabase.from('audit_logs').insert({
        action: 'project_created',
        entity_type: 'project',
        entity_id: project.id,
        details: { client_name: formData.client_name }
      });

      setResult({ success: true, message: 'Project created successfully!' });
      setFormData({
        client_name: '',
        project_location: '',
        project_city: '',
        start_date: '',
        end_date: '',
        status: 'active'
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create project'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-slate-900">Create New Project</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Client Name *
          </label>
          <input
            type="text"
            required
            value={formData.client_name}
            onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Acme Corporation"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Project Location (Address) *
          </label>
          <input
            type="text"
            required
            value={formData.project_location}
            onChange={(e) => setFormData({ ...formData, project_location: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="123 Business St, Suite 500, New York, NY 10001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Project City (For Flight Search) *
          </label>
          <input
            type="text"
            required
            value={formData.project_city}
            onChange={(e) => setFormData({ ...formData, project_city: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="New York"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Start Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              End Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'completed' | 'cancelled' })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Creating Project...
            </>
          ) : (
            <>
              <Building2 className="w-5 h-5" />
              Create Project
            </>
          )}
        </button>
      </form>

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
