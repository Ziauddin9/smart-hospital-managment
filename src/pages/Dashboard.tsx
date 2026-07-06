import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import StatCard from '../components/StatCard';
import {
  Users, UserCog, Calendar, Receipt, Pill, FlaskConical,
  Clock, CheckCircle, AlertCircle, TrendingUp, Activity
} from 'lucide-react';

interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  todayAppointments: number;
  pendingBills: number;
  lowStockMedicines: number;
  pendingLabTests: number;
  completedAppointmentsToday: number;
  newPatientsThisMonth: number;
}

interface RecentAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  type: string;
  status: string;
  patients: { full_name: string; patient_number: string } | null;
  doctors: { full_name: string; specialization: string } | null;
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-sky-100 text-sky-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-amber-100 text-amber-700',
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalDoctors: 0,
    todayAppointments: 0,
    pendingBills: 0,
    lowStockMedicines: 0,
    pendingLabTests: 0,
    completedAppointmentsToday: 0,
    newPatientsThisMonth: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      const [
        { count: patients },
        { count: doctors },
        { count: todayAppts },
        { count: completedToday },
        { count: pendingBills },
        { count: lowStock },
        { count: pendingLabs },
        { count: newPatients },
        { data: recentAppts },
      ] = await Promise.all([
        supabase.from('patients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today).eq('status', 'completed'),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).in('status', ['pending', 'draft']),
        supabase.from('medicines').select('*', { count: 'exact', head: true }).lte('quantity_in_stock', 10),
        supabase.from('lab_tests').select('*', { count: 'exact', head: true }).in('status', ['ordered', 'sample_collected', 'processing']),
        supabase.from('patients').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
        supabase.from('appointments')
          .select('id, appointment_date, appointment_time, type, status, patients(full_name, patient_number), doctors(full_name, specialization)')
          .order('appointment_date', { ascending: false })
          .order('appointment_time', { ascending: false })
          .limit(6),
      ]);

      setStats({
        totalPatients: patients ?? 0,
        totalDoctors: doctors ?? 0,
        todayAppointments: todayAppts ?? 0,
        pendingBills: pendingBills ?? 0,
        lowStockMedicines: lowStock ?? 0,
        pendingLabTests: pendingLabs ?? 0,
        completedAppointmentsToday: completedToday ?? 0,
        newPatientsThisMonth: newPatients ?? 0,
      });

      setRecentAppointments((recentAppts ?? []) as unknown as RecentAppointment[]);
      setLoading(false);
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-24 mb-3" />
              <div className="h-7 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sky-100 text-sm font-medium">Good morning,</p>
            <h2 className="text-xl font-bold mt-0.5">Hospital Administrator</h2>
            <p className="text-sky-100 text-sm mt-1">
              {stats.todayAppointments} appointments scheduled today &bull; {stats.completedAppointmentsToday} completed
            </p>
          </div>
          <Activity className="w-12 h-12 text-sky-300 opacity-80 hidden sm:block" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Patients"
          value={stats.totalPatients}
          icon={Users}
          color="sky"
          trend={{ value: 12, label: 'vs last month' }}
        />
        <StatCard
          label="Active Doctors"
          value={stats.totalDoctors}
          icon={UserCog}
          color="emerald"
        />
        <StatCard
          label="Today's Appointments"
          value={stats.todayAppointments}
          icon={Calendar}
          color="violet"
          subtitle={`${stats.completedAppointmentsToday} completed`}
        />
        <StatCard
          label="Pending Bills"
          value={stats.pendingBills}
          icon={Receipt}
          color="amber"
        />
        <StatCard
          label="Low Stock Meds"
          value={stats.lowStockMedicines}
          icon={Pill}
          color="rose"
          subtitle="Needs reorder"
        />
        <StatCard
          label="Pending Lab Tests"
          value={stats.pendingLabTests}
          icon={FlaskConical}
          color="teal"
        />
        <StatCard
          label="New Patients"
          value={stats.newPatientsThisMonth}
          icon={TrendingUp}
          color="sky"
          subtitle="This month"
        />
        <StatCard
          label="Completed Today"
          value={stats.completedAppointmentsToday}
          icon={CheckCircle}
          color="emerald"
          subtitle="Appointments"
        />
      </div>

      {/* Recent Appointments */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900">Recent Appointments</h3>
          </div>
          <span className="text-xs text-slate-400">{recentAppointments.length} records</span>
        </div>

        {recentAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Calendar className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-th">Patient</th>
                  <th className="table-th">Doctor</th>
                  <th className="table-th">Date & Time</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentAppointments.map(appt => (
                  <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="table-td">
                      <div>
                        <p className="font-medium text-slate-900">{appt.patients?.full_name ?? 'N/A'}</p>
                        <p className="text-xs text-slate-400">{appt.patients?.patient_number}</p>
                      </div>
                    </td>
                    <td className="table-td">
                      <div>
                        <p className="font-medium text-slate-900">{appt.doctors?.full_name ?? 'N/A'}</p>
                        <p className="text-xs text-slate-400">{appt.doctors?.specialization}</p>
                      </div>
                    </td>
                    <td className="table-td">
                      <p>{new Date(appt.appointment_date).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-400">{appt.appointment_time?.slice(0, 5)}</p>
                    </td>
                    <td className="table-td capitalize">{appt.type.replace('_', ' ')}</td>
                    <td className="table-td">
                      <span className={`badge ${statusColors[appt.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {appt.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-900">Alerts</h3>
          </div>
          <div className="space-y-2">
            {stats.lowStockMedicines > 0 && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                <Pill className="w-3.5 h-3.5 text-amber-500" />
                <p className="text-xs text-amber-700">{stats.lowStockMedicines} medicines below reorder level</p>
              </div>
            )}
            {stats.pendingBills > 0 && (
              <div className="flex items-center gap-2 p-2 bg-rose-50 rounded-lg">
                <Receipt className="w-3.5 h-3.5 text-rose-500" />
                <p className="text-xs text-rose-700">{stats.pendingBills} unpaid invoices pending</p>
              </div>
            )}
            {stats.pendingLabTests > 0 && (
              <div className="flex items-center gap-2 p-2 bg-sky-50 rounded-lg">
                <FlaskConical className="w-3.5 h-3.5 text-sky-500" />
                <p className="text-xs text-sky-700">{stats.pendingLabTests} lab tests in progress</p>
              </div>
            )}
            {stats.lowStockMedicines === 0 && stats.pendingBills === 0 && stats.pendingLabTests === 0 && (
              <p className="text-xs text-slate-400">No alerts at this time.</p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-sky-500" />
            <h3 className="text-sm font-semibold text-slate-900">Today's Overview</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Scheduled</span>
              <span className="text-xs font-semibold text-slate-700">{stats.todayAppointments}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-sky-500 h-1.5 rounded-full transition-all"
                style={{ width: stats.todayAppointments ? `${Math.min((stats.completedAppointmentsToday / stats.todayAppointments) * 100, 100)}%` : '0%' }}
              />
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-emerald-600 font-medium">{stats.completedAppointmentsToday} completed</span>
              <span className="text-slate-400">{stats.todayAppointments - stats.completedAppointmentsToday} remaining</span>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-slate-900">Patient Growth</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Total Active</span>
              <span className="text-sm font-bold text-slate-900">{stats.totalPatients}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">New This Month</span>
              <span className="text-xs font-semibold text-emerald-600">+{stats.newPatientsThisMonth}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
