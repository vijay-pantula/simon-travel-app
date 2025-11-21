import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Consultant } from '../../types';
import { User, Mail, MapPin, Loader, Edit2, Save, X } from 'lucide-react';

export function ConsultantsList() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Consultant>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConsultants();
  }, []);

  const loadConsultants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('consultants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConsultants(data || []);
    } catch (error) {
      console.error('Error loading consultants:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (consultant: Consultant) => {
    setEditingId(consultant.id);
    setEditForm({
      name: consultant.name,
      email: consultant.email,
      home_location: consultant.home_location,
      base_airport: consultant.base_airport,
      passport_country: consultant.passport_country,
      date_of_birth: consultant.date_of_birth
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (consultantId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('consultants')
        .update({
          name: editForm.name,
          email: editForm.email,
          home_location: editForm.home_location,
          base_airport: editForm.base_airport,
          passport_country: editForm.passport_country,
          date_of_birth: editForm.date_of_birth,
          updated_at: new Date().toISOString()
        })
        .eq('id', consultantId);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'consultant_updated',
        entity_type: 'consultant',
        entity_id: consultantId,
        details: editForm
      });

      await loadConsultants();
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating consultant:', error);
      alert('Failed to update consultant');
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
        <h2 className="text-2xl font-bold text-slate-900">Consultants</h2>
        <p className="text-sm text-slate-600 mt-1">{consultants.length} total consultants</p>
      </div>

      {consultants.length === 0 ? (
        <div className="p-12 text-center">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No consultants yet</p>
          <p className="text-sm text-slate-500 mt-1">Upload a CSV file to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Base Airport</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {consultants.map((consultant) => {
                const isEditing = editingId === consultant.id;
                return (
                  <tr key={consultant.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">{consultant.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="email"
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-4 h-4" />
                          {consultant.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.home_location || ''}
                          onChange={(e) => setEditForm({ ...editForm, home_location: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin className="w-4 h-4" />
                          {consultant.home_location || '-'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.base_airport || ''}
                          onChange={(e) => setEditForm({ ...editForm, base_airport: e.target.value.toUpperCase() })}
                          maxLength={3}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        />
                      ) : (
                        <span className="text-sm text-slate-900 font-mono">
                          {consultant.base_airport || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveEdit(consultant.id)}
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
                          onClick={() => startEdit(consultant)}
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
