export default function StatsCard({ label, value, subtitle }) {
  return (
    <div className="bg-white border border-border rounded-md p-4">
      <p className="text-xs text-mid font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-navy mt-1">{value}</p>
      {subtitle && <p className="text-xs text-slate-custom mt-1">{subtitle}</p>}
    </div>
  );
}
