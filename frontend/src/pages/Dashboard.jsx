import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import StatsCard from '../components/StatsCard';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/scheduler/schedules'),
    ])
      .then(([s, sch]) => {
        setStats(s);
        setSchedules(sch || []);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Failed to connect to backend server');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-navy mb-6">College Admin Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-md" />
          ))}
        </div>
        <SkeletonLoader rows={6} cols={6} />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-navy mb-4">College Admin Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-red-800 mb-6">
          <div className="flex items-center gap-2 mb-2 font-semibold">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Cannot Load Dashboard Data
          </div>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <div className="text-xs text-red-600 mb-4 space-y-1">
            <p>• Make sure the backend API is reachable at <code className="bg-red-100 px-1 py-0.5 rounded font-mono">/api/dashboard/stats</code></p>
            <p>• Check if the API docs are accessible at <a href="/docs" target="_blank" rel="noreferrer" className="underline font-semibold">/docs</a></p>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm"
          >
            Retry Loading Data
          </button>
        </div>
      </div>
    );
  }

  const statCards = stats
    ? [
        { label: 'Total Classes', value: stats.total_classes },
        { label: 'Total Batches', value: stats.total_batches },
        { label: 'Total Subjects/Labs', value: stats.total_subjects },
        { label: 'Total Faculty', value: stats.total_faculty },
        { label: 'Total Laboratories', value: stats.total_laboratories },
        { label: 'Available Lab Capacity', value: `${stats.available_lab_capacity} seats` },
        { label: 'Scheduled Exams', value: stats.scheduled_exams },
        { label: 'Pending Exams', value: stats.pending_exams },
      ]
    : [];

  // Group schedules by date for calendar view
  const byDate = {};
  schedules.forEach((s) => {
    if (!byDate[s.exam_date]) byDate[s.exam_date] = [];
    byDate[s.exam_date].push(s);
  });
  const sortedDates = Object.keys(byDate).sort();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-navy">College Admin Dashboard</h1>
        <p className="text-xs text-mid mt-0.5">Automation Lab Practical Examination Scheduling & Resource Allocation Overview</p>
      </div>

      {/* Quick Action Buttons (Specification Section 1) */}
      <div className="bg-white border border-border rounded-md p-4 mb-6">
        <p className="text-xs font-semibold text-navy uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/classes" className="px-3 py-1.5 text-xs bg-white border border-border text-navy rounded hover:bg-ghost transition-colors">
            + Add Class
          </Link>
          <Link to="/batches" className="px-3 py-1.5 text-xs bg-white border border-border text-navy rounded hover:bg-ghost transition-colors">
            + Add Batch
          </Link>
          <Link to="/subjects" className="px-3 py-1.5 text-xs bg-white border border-border text-navy rounded hover:bg-ghost transition-colors">
            + Add Subject
          </Link>
          <Link to="/faculty" className="px-3 py-1.5 text-xs bg-white border border-border text-navy rounded hover:bg-ghost transition-colors">
            + Add Faculty
          </Link>
          <Link to="/laboratories" className="px-3 py-1.5 text-xs bg-white border border-border text-navy rounded hover:bg-ghost transition-colors">
            + Add Laboratory
          </Link>
          <Link to="/scheduler" className="px-3.5 py-1.5 text-xs bg-bright text-white font-medium rounded hover:opacity-90 transition-colors shadow-sm">
            Auto Allocate / Create Schedule
          </Link>
          <Link to="/schedule" className="px-3 py-1.5 text-xs bg-steel text-white rounded hover:bg-steel-dark transition-colors">
            View Schedule
          </Link>
          <Link to="/workload" className="px-3 py-1.5 text-xs bg-white border border-border text-navy rounded hover:bg-ghost transition-colors">
            Faculty Workload
          </Link>
          <Link to="/utilization" className="px-3 py-1.5 text-xs bg-white border border-border text-navy rounded hover:bg-ghost transition-colors">
            Lab Utilization
          </Link>
          <Link to="/reports" className="px-3 py-1.5 text-xs bg-white border border-border text-navy rounded hover:bg-ghost transition-colors">
            Export Schedule
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((c) => (
          <StatsCard key={c.label} label={c.label} value={c.value} />
        ))}
      </div>

      {/* Calendar / Timetable View */}
      <div className="bg-white border border-border rounded-md">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy">Practical Exam Timetable View</h2>
          <span className="text-xs text-mid">{schedules.length} Total Scheduled Exams</span>
        </div>
        {sortedDates.length === 0 ? (
          <div className="px-5 py-8 text-center text-mid text-sm">
            No exams scheduled yet. Use the Auto Scheduler to generate a schedule.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ice">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Section</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Batch</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Venue</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Main In-Charge</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Co-In-Charge</th>
                </tr>
              </thead>
              <tbody>
                {sortedDates.map((date) =>
                  byDate[date].map((s, i) => (
                    <tr
                      key={s.id}
                      className={`border-t border-border ${i % 2 === 1 ? 'bg-ghost' : 'bg-white'} hover:bg-ice/40 transition-colors`}
                    >
                      <td className="px-4 py-3 font-medium text-navy">{date}</td>
                      <td className="px-4 py-3">{s.start_time} - {s.end_time}</td>
                      <td className="px-4 py-3">{s.class_name}</td>
                      <td className="px-4 py-3">{s.section_name}</td>
                      <td className="px-4 py-3 font-medium">{s.batch_name}</td>
                      <td className="px-4 py-3 text-steel-dark font-medium">{s.subject_name}</td>
                      <td className="px-4 py-3">{s.lab_name}</td>
                      <td className="px-4 py-3 font-medium">{s.incharge_name}</td>
                      <td className="px-4 py-3 text-mid">{s.co_incharge_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

