import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Project } from '../../types';
import { Calendar, Building2, Loader, MapPin, Edit2, Save, X } from 'lucide-react';

export function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Project>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setEditForm({
      client_name: project.client_name,
      project_location: project.project_location,
      project_city: project.project_city,
      start_date: project.start_date,
      end_date: project.end_date,
      status: project.status
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (projectId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          client_name: editForm.client_name,
          project_location: editForm.project_location,
          project_city: editForm.project_city,
          start_date: editForm.start_date,
          end_date: editForm.end_date,
          status: editForm.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'project_updated',
        entity_type: 'project',
        entity_id: projectId,
        details: editForm
      });

      await loadProjects();
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 flex items-center justify-center">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900">Projects</h2>
        <p className="text-sm text-slate-600 mt-1">{projects.length} total projects</p>
      </div>

      {projects.length === 0 ? (
        <div className="p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No projects yet</p>
          <p className="text-sm text-slate-500 mt-1">Upload a CSV file to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {projects.map((project) => {
                const isEditing = editingId === project.id;
                return (
                  <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.client_name || ''}
                          onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">{project.client_name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.project_location || ''}
                          onChange={(e) => setEditForm({ ...editForm, project_location: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin className="w-4 h-4" />
                          <span className="max-w-xs truncate" title={project.project_location || ''}>
                            {project.project_location || '-'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.project_city || ''}
                          onChange={(e) => setEditForm({ ...editForm, project_city: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <span className="text-sm text-slate-600">
                          {project.project_city || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.start_date || ''}
                          onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(project.start_date).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.end_date || ''}
                          onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(project.end_date).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <select
                          value={editForm.status || 'active'}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="px-2 py-1 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="active">active</option>
                          <option value="completed">completed</option>
                          <option value="on_hold">on_hold</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          project.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : project.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {project.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveEdit(project.id)}
                            disabled={saving}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                            title="Save"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={saving}
                            className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors disabled:opacity-50"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(project)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
