import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: 'sky' | 'emerald' | 'violet' | 'amber' | 'rose' | 'teal';
  trend?: { value: number; label: string };
  subtitle?: string;
}

const colorMap = {
  sky: { bg: 'bg-sky-50', icon: 'bg-sky-500', text: 'text-sky-600' },
  emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-500', text: 'text-emerald-600' },
  violet: { bg: 'bg-violet-50', icon: 'bg-violet-500', text: 'text-violet-600' },
  amber: { bg: 'bg-amber-50', icon: 'bg-amber-500', text: 'text-amber-600' },
  rose: { bg: 'bg-rose-50', icon: 'bg-rose-500', text: 'text-rose-600' },
  teal: { bg: 'bg-teal-50', icon: 'bg-teal-500', text: 'text-teal-600' },
};

export default function StatCard({ label, value, icon: Icon, color, trend, subtitle }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="card p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              <span>{trend.value >= 0 ? '+' : ''}{trend.value}%</span>
              <span className="text-slate-400 font-normal">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`w-11 h-11 ${c.icon} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
