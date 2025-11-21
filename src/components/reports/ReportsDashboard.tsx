import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart3, TrendingUp, Users, Plane, DollarSign, Clock } from 'lucide-react';

interface Stats {
  totalProjects: number;
  totalConsultants: number;
  totalSearches: number;
  totalBookings: number;
  avgFare: number;
  directFlightPercent: number;
}

export function ReportsDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    totalConsultants: 0,
    totalSearches: 0,
    totalBookings: 0,
    avgFare: 0,
    directFlightPercent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [projects, consultants, searches, bookings, options] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('consultants').select('id', { count: 'exact', head: true }),
        supabase.from('flight_searches').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('flight_options').select('price, layovers'),
      ]);

      const avgFare = options.data && options.data.length > 0
        ? options.data.reduce((sum, opt) => sum + opt.price, 0) / options.data.length
        : 0;

      const directFlights = options.data ? options.data.filter(opt => opt.layovers === 0).length : 0;
      const directPercent = options.data && options.data.length > 0
        ? (directFlights / options.data.length) * 100
        : 0;

      setStats({
        totalProjects: projects.count || 0,
        totalConsultants: consultants.count || 0,
        totalSearches: searches.count || 0,
        totalBookings: bookings.count || 0,
        avgFare: Math.round(avgFare),
        directFlightPercent: Math.round(directPercent),
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Projects',
      value: stats.totalProjects,
      icon: BarChart3,
      color: 'bg-blue-500',
    },
    {
      label: 'Total Consultants',
      value: stats.totalConsultants,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      label: 'Flight Searches',
      value: stats.totalSearches,
      icon: Plane,
      color: 'bg-orange-500',
    },
    {
      label: 'Bookings',
      value: stats.totalBookings,
      icon: Clock,
      color: 'bg-slate-500',
    },
    {
      label: 'Avg Fare',
      value: `$${stats.avgFare}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
    {
      label: 'Direct Flights',
      value: `${stats.directFlightPercent}%`,
      icon: TrendingUp,
      color: 'bg-cyan-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Analytics Dashboard</h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-slate-600">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}

function RecentActivity() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  return (
    <div className="divide-y divide-slate-200">
      {activities.map((activity) => (
        <div key={activity.id} className="py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">{activity.action.replace(/_/g, ' ')}</p>
            <p className="text-xs text-slate-600">
              {new Date(activity.created_at).toLocaleString()}
            </p>
          </div>
          <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
            {activity.entity_type}
          </span>
        </div>
      ))}
    </div>
  );
}
