import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Mail, MapPin, Plane, Loader, CheckCircle, XCircle } from 'lucide-react';

export function CreateConsultantForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    home_location: '',
    base_airport: '',
    passport_country: '',
    date_of_birth: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase
        .from('consultants')
        .insert([{
          name: formData.name,
          email: formData.email,
          home_location: formData.home_location || null,
          base_airport: formData.base_airport || null,
          passport_country: formData.passport_country || null,
          date_of_birth: formData.date_of_birth || null,
          loyalty_programs: {},
          preferences: {}
        }])
        .select()
        .single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'consultant_created',
        entity_type: 'consultant',
        entity_id: data.id,
        details: { name: formData.name, email: formData.email }
      });

      setResult({ success: true, message: 'Consultant created successfully!' });
      setFormData({
        name: '',
        email: '',
        home_location: '',
        base_airport: '',
        passport_country: '',
        date_of_birth: ''
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create consultant'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-slate-900">Create New Consultant</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="john.doe@example.com"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Home Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.home_location}
                onChange={(e) => setFormData({ ...formData, home_location: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="New York, NY"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Base Airport Code
            </label>
            <div className="relative">
              <Plane className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.base_airport}
                onChange={(e) => setFormData({ ...formData, base_airport: e.target.value.toUpperCase() })}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="JFK"
                maxLength={3}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Passport Country
            </label>
            <input
              type="text"
              value={formData.passport_country}
              onChange={(e) => setFormData({ ...formData, passport_country: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="United States"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Creating Consultant...
            </>
          ) : (
            <>
              <User className="w-5 h-5" />
              Create Consultant
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
