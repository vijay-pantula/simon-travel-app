import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Project, ProjectRules } from '../../types';
import { Settings, Save, Loader } from 'lucide-react';

export function ProjectRulesManager({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [rules, setRules] = useState<Partial<ProjectRules>>({
    routing_preference: 'prefer_direct',
    allow_one_stop: true,
    exclude_red_eyes: true,
    max_connections: 1,
    pricing_preference: 'cheapest',
    baggage_included_only: false,
    refundable_only: false,
    advance_purchase_days: 14,
    cabin_class: 'economy',
    preferred_carriers: [],
    blocked_carriers: [],
    allowed_airports: [],
    blocked_days_of_week: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProjectAndRules();
  }, [projectId]);

  const loadProjectAndRules = async () => {
    try {
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectData) {
        setProject(projectData);

        const { data: rulesData } = await supabase
          .from('project_rules')
          .select('*')
          .eq('project_id', projectId)
          .maybeSingle();

        if (rulesData) {
          setRules(rulesData);
        }
      }
    } catch (error) {
      console.error('Error loading project rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const { data: existing } = await supabase
        .from('project_rules')
        .select('id')
        .eq('project_id', projectId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('project_rules')
          .update(rules)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('project_rules')
          .insert({ ...rules, project_id: projectId });
      }

      await supabase.from('audit_logs').insert({
        action: 'project_rules_updated',
        entity_type: 'project_rules',
        entity_id: projectId,
        details: rules
      });

      setMessage('Rules saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to save rules');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader className="w-6 h-6 animate-spin" />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-xl font-bold text-slate-900">Project Rules</h3>
            <p className="text-sm text-slate-600">{project?.client_name}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Rules'}
        </button>
      </div>

      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {message}
        </div>
      )}

      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Routing Preference
            </label>
            <select
              value={rules.routing_preference}
              onChange={(e) => setRules({ ...rules, routing_preference: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="prefer_direct">Prefer Direct</option>
              <option value="allow_connections">Allow Connections</option>
              <option value="cheapest">Cheapest Available</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Max Connections
            </label>
            <input
              type="number"
              value={rules.max_connections}
              onChange={(e) => setRules({ ...rules, max_connections: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
              max="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Pricing Preference
            </label>
            <select
              value={rules.pricing_preference}
              onChange={(e) => setRules({ ...rules, pricing_preference: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="cheapest">Cheapest Available</option>
              <option value="balanced">Balanced</option>
              <option value="fastest">Fastest</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Max Fare Cap ($)
            </label>
            <input
              type="number"
              value={rules.max_fare_cap || ''}
              onChange={(e) => setRules({ ...rules, max_fare_cap: e.target.value ? parseFloat(e.target.value) : null })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="No cap"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cabin Class
            </label>
            <select
              value={rules.cabin_class}
              onChange={(e) => setRules({ ...rules, cabin_class: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Advance Purchase (days)
            </label>
            <input
              type="number"
              value={rules.advance_purchase_days}
              onChange={(e) => setRules({ ...rules, advance_purchase_days: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rules.allow_one_stop}
                onChange={(e) => setRules({ ...rules, allow_one_stop: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Allow One Stop</span>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rules.exclude_red_eyes}
                onChange={(e) => setRules({ ...rules, exclude_red_eyes: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Exclude Red-eye Flights</span>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rules.baggage_included_only}
                onChange={(e) => setRules({ ...rules, baggage_included_only: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Baggage Included Only</span>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rules.refundable_only}
                onChange={(e) => setRules({ ...rules, refundable_only: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Refundable Only</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Preferred Carriers (comma-separated)
          </label>
          <input
            type="text"
            value={rules.preferred_carriers?.join(', ') || ''}
            onChange={(e) => setRules({ ...rules, preferred_carriers: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., AA, UA, DL"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Blocked Carriers (comma-separated)
          </label>
          <input
            type="text"
            value={rules.blocked_carriers?.join(', ') || ''}
            onChange={(e) => setRules({ ...rules, blocked_carriers: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., NK, F9"
          />
        </div>
      </div>
    </div>
  );
}
