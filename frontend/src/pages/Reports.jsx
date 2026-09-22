import { useState, useEffect } from 'react';
import api, { API_BASE } from '../api/client';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Reports() {
  const [sections, setSections] = useState([]);
  const [batches, setBatches] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState({
    type: 'all',
    section_id: '',
    batch_id: '',
    faculty_id: '',
    lab_id: '',
  });

  useEffect(() => {
    Promise.all([
      api.get('/sections'),
      api.get('/batches'),
      api.get('/faculty'),
      api.get('/laboratories'),
    ])
      .then(([s, b, f, l]) => {
        setSections(s || []);
        setBatches(b || []);
        setFaculty(f || []);
        setLabs(l || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filter.type === 'class' && filter.section_id) params.set('section_id', filter.section_id);
    if (filter.type === 'batch' && filter.batch_id) params.set('batch_id', filter.batch_id);
    if (filter.type === 'faculty' && filter.faculty_id) params.set('faculty_id', filter.faculty_id);
    if (filter.type === 'lab' && filter.lab_id) params.set('lab_id', filter.lab_id);
    return params.toString() ? `?${params.toString()}` : '';
  };

  const download = (format) => {
    const query = buildQuery();
    const exportBase = API_BASE.startsWith('/') ? `${window.location.origin}${API_BASE}` : API_BASE;
    window.open(`${exportBase}/export/${format}${query}`, '_blank');
  };

  if (loading) return <div><h1 className="text-xl font-semibold text-navy mb-6">Reports & Export</h1><SkeletonLoader rows={3} cols={3} /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-navy">Reports & Timetable Export</h1>
        <p className="text-xs text-mid mt-0.5">Generate and download official PDF, Excel, and CSV practical examination timetables.</p>
      </div>

      <div className="bg-white border border-border rounded-md p-5">
        <h3 className="text-sm font-semibold text-navy mb-4">Export Practical Exam Schedule</h3>

        {/* Filter Type */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-navy mb-2">Schedule Scope / Report Type</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: '1. Complete Exam Schedule' },
              { key: 'class', label: '2. Class-wise Schedule' },
              { key: 'batch', label: '3. Batch-wise Schedule' },
              { key: 'faculty', label: '4. Faculty-wise Schedule' },
              { key: 'lab', label: '5. Lab-wise Schedule' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter({ ...filter, type: t.key })}
                className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                  filter.type === t.key ? 'bg-steel text-white border-steel' : 'bg-white text-navy border-border hover:bg-ghost'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional Filter */}
        {filter.type === 'class' && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-navy mb-1">Select Section</label>
            <select value={filter.section_id} onChange={(e) => setFilter({ ...filter, section_id: e.target.value })} className="w-full max-w-sm px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel">
              <option value="">All Sections</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.class_name} - Section {s.name}</option>)}
            </select>
          </div>
        )}

        {filter.type === 'batch' && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-navy mb-1">Select Batch</label>
            <select value={filter.batch_id} onChange={(e) => setFilter({ ...filter, batch_id: e.target.value })} className="w-full max-w-sm px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel">
              <option value="">All Batches</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.class_name} - {b.section_name} ({b.name}, {b.size} students)</option>)}
            </select>
          </div>
        )}

        {filter.type === 'faculty' && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-navy mb-1">Select Faculty</label>
            <select value={filter.faculty_id} onChange={(e) => setFilter({ ...filter, faculty_id: e.target.value })} className="w-full max-w-sm px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel">
              <option value="">All Faculty</option>
              {faculty.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.faculty_id_code})</option>)}
            </select>
          </div>
        )}

        {filter.type === 'lab' && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-navy mb-1">Select Laboratory / Venue</label>
            <select value={filter.lab_id} onChange={(e) => setFilter({ ...filter, lab_id: e.target.value })} className="w-full max-w-sm px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel">
              <option value="">All Laboratories</option>
              {labs.map((l) => <option key={l.id} value={l.id}>{l.name} (Cap: {l.capacity})</option>)}
            </select>
          </div>
        )}

        {/* Export Buttons */}
        <div className="pt-2 border-t border-border flex gap-3 flex-wrap items-center">
          <button onClick={() => download('excel')} className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-green-700 text-white rounded hover:bg-green-800 transition-colors shadow-sm">
            Export Excel (.xlsx)
          </button>
          <button onClick={() => download('pdf')} className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-red-700 text-white rounded hover:bg-red-800 transition-colors shadow-sm">
            Export PDF (.pdf)
          </button>
          <button onClick={() => download('csv')} className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-steel text-white rounded hover:bg-steel-dark transition-colors shadow-sm">
            Export CSV (.csv)
          </button>
        </div>
      </div>
    </div>
  );
}

