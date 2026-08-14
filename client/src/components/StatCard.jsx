import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ label, value, icon, trend, trendLabel, trendUp = true, iconBg = 'bg-primary-50 text-primary' }) {
  return (
    <div className="card p-5 flex items-start justify-between hover:shadow-cardhover transition-shadow">
      <div>
        <p className="label !text-xs !mb-2">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-ink leading-none">{value}</p>
        {trendLabel && (
          <div className={`flex items-center gap-1 mt-2.5 text-xs font-medium ${trendUp ? 'text-success-dark' : 'text-danger'}`}>
            {trendUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {trendLabel}
          </div>
        )}
      </div>
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
    </div>
  );
}
