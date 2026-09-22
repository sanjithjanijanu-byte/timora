import { useState, useEffect } from 'react';
import api from '../api/client';
import SkeletonLoader from '../components/SkeletonLoader';

const severityStyles = {
  error: 'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
};

const severityDot = {
  error: 'bg-red-500',
  warning: 'bg-amber-500',
};

const typeLabels = {
  batch_clash: 'Batch Clash',
  lab_clash: 'Lab Clash',
  faculty_clash: 'Faculty Clash',
  capacity_violation: 'Lab Capacity Issue',
  workload_violation: 'Faculty Workload',
  same_faculty: 'Same Faculty',
  missing_time_slot: 'Missing Time Slot',
  missing_venue: 'Missing Venue',
};

export default function Conflicts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [resolveResult, setResolveResult] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/conflicts').then(setData).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAutoResolve = async () => {
    setResolving(true);
    setResolveResult(null);
    try {
      const res = await api.post('/conflicts/auto-resolve', {});
      setResolveResult(res);
      load();
    } catch (err) {
      alert('Auto-resolution failed: ' + err.message);
    } finally {
      setResolving(false);
    }
  };

  if (loading && !resolving) return <div><h1 className="text-xl font-semibold text-navy mb-6">Conflicts</h1><SkeletonLoader rows={4} cols={3} /></div>;

  const conflicts = data?.conflicts || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-navy">Conflict Detection</h1>
          <p className="text-xs text-mid mt-0.5">Scans all practical exam schedules against the 14 allocation constraints.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-4 py-2 text-sm bg-white border border-border text-navy rounded hover:bg-ghost transition-colors">
            Re-check
          </button>
          {conflicts.length > 0 && (
            <button
              onClick={handleAutoResolve}
              disabled={resolving}
              className="px-4 py-2 text-sm bg-bright text-white rounded hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {resolving ? 'Resolving Conflicts...' : 'Auto Resolve Conflicts'}
            </button>
          )}
        </div>
      </div>

      {/* Resolution banner */}
      {resolveResult && (
        <div className="mb-6 p-4 rounded-md border border-blue-200 bg-blue-50">
          <p className="text-sm font-medium text-navy">{resolveResult.message}</p>
          <p className="text-xs text-mid mt-1">
            Remaining unresolved conflicts: <span className="font-semibold">{resolveResult.remaining_conflicts}</span>
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-border rounded-md p-4">
          <p className="text-xs text-mid uppercase">Total Conflicts</p>
          <p className="text-2xl font-semibold text-navy mt-1">{data?.total || 0}</p>
        </div>
        <div className="bg-white border border-border rounded-md p-4">
          <p className="text-xs text-mid uppercase">Errors</p>
          <p className="text-2xl font-semibold text-red-600 mt-1">{data?.errors || 0}</p>
        </div>
        <div className="bg-white border border-border rounded-md p-4">
          <p className="text-xs text-mid uppercase">Warnings</p>
          <p className="text-2xl font-semibold text-amber-600 mt-1">{data?.warnings || 0}</p>
        </div>
      </div>

      {/* Conflict List */}
      {conflicts.length === 0 ? (
        <div className="bg-white border border-green-200 rounded-md px-5 py-8 text-center">
          <p className="text-sm text-green-700 font-medium">No conflicts detected. All schedules satisfy laboratory capacity, time slots, and faculty constraints.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conflicts.map((c, i) => (
            <div key={i} className={`border rounded-md p-4 ${severityStyles[c.severity] || ''}`}>
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${severityDot[c.severity] || 'bg-gray-400'}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-navy">
                      {typeLabels[c.conflict_type] || c.conflict_type}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded capitalize ${c.severity === 'error' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {c.severity}
                    </span>
                  </div>
                  <p className="text-sm text-mid mt-1">{c.message}</p>
                  {c.schedule_id && (
                    <p className="text-xs text-mid mt-1">Schedule Entry ID: #{c.schedule_id}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

