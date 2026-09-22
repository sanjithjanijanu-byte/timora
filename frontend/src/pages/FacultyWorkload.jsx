import { useState, useEffect } from 'react';
import api from '../api/client';
import SkeletonLoader from '../components/SkeletonLoader';

export default function FacultyWorkload() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/faculty').then(setFaculty).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div><h1 className="text-xl font-semibold text-navy mb-6">Faculty Workload</h1><SkeletonLoader /></div>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-navy mb-6">Faculty Workload</h1>

      <div className="bg-white border border-border rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ice">
              <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Faculty</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Department</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Max Load</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Assigned</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Remaining</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Utilization</th>
            </tr>
          </thead>
          <tbody>
            {faculty.map((f, i) => {
              const remaining = f.max_load - f.current_load;
              const pct = f.max_load > 0 ? Math.round((f.current_load / f.max_load) * 100) : 0;
              const barColor = pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-green-500';
              return (
                <tr key={f.id} className={`border-t border-border ${i % 2 === 1 ? 'bg-ghost' : 'bg-white'}`}>
                  <td className="px-4 py-3 font-medium">{f.name}</td>
                  <td className="px-4 py-3 text-mid">{f.department_name}</td>
                  <td className="px-4 py-3">{f.max_load}</td>
                  <td className="px-4 py-3">{f.current_load}</td>
                  <td className="px-4 py-3">
                    <span className={remaining <= 0 ? 'text-red-600 font-medium' : ''}>{remaining}</span>
                  </td>
                  <td className="px-4 py-3 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-2 rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="text-xs text-mid w-8 text-right">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {faculty.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-mid text-sm">No faculty data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
