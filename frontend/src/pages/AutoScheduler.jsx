import { useState, useEffect } from 'react';
import api from '../api/client';
import SkeletonLoader from '../components/SkeletonLoader';

export default function AutoScheduler() {
  const [sections, setSections] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [labs, setLabs] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const [selected, setSelected] = useState({
    section_ids: [],
    subject_ids: [],
    lab_ids: [],
    faculty_ids: [],
    time_slot_ids: [],
    exam_dates: [],
    max_batch_size: 35,
  });
  const [dateInput, setDateInput] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/sections'),
      api.get('/batches'),
      api.get('/subjects'),
      api.get('/laboratories'),
      api.get('/faculty'),
      api.get('/time-slots'),
    ])
      .then(([sec, btc, sub, lab, fac, ts]) => {
        setSections(sec || []);
        setBatches(btc || []);
        setSubjects(sub || []);
        setLabs(lab || []);
        setFaculty(fac || []);
        setTimeSlots(ts || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleId = (key, id) => {
    setSelected((prev) => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter((x) => x !== id) : [...prev[key], id],
    }));
  };

  const addDate = () => {
    if (dateInput && !selected.exam_dates.includes(dateInput)) {
      setSelected((prev) => ({ ...prev, exam_dates: [...prev.exam_dates, dateInput] }));
      setDateInput('');
    }
  };

  const removeDate = (d) => {
    setSelected((prev) => ({ ...prev, exam_dates: prev.exam_dates.filter((x) => x !== d) }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setResult(null);
    try {
      const res = await api.post('/scheduler/generate', selected);
      setResult(res);
    } catch (err) {
      alert('Scheduling failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate =
    selected.section_ids.length > 0 &&
    selected.subject_ids.length > 0 &&
    selected.lab_ids.length > 0 &&
    selected.faculty_ids.length >= 2 &&
    selected.time_slot_ids.length > 0 &&
    selected.exam_dates.length > 0;

  if (loading) return <div><h1 className="text-xl font-semibold text-navy mb-6">Auto Scheduler</h1><SkeletonLoader /></div>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-navy mb-6">Auto Scheduler</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sections */}
        <div className="bg-white border border-border rounded-md p-4">
          <h3 className="text-sm font-semibold text-navy mb-3">1. Select Sections</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {sections.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm text-navy cursor-pointer hover:bg-ghost px-2 py-1 rounded">
                <input type="checkbox" checked={selected.section_ids.includes(s.id)} onChange={() => toggleId('section_ids', s.id)} className="rounded" />
                {s.class_name} - {s.name} ({s.student_count} students)
              </label>
            ))}
            {sections.length === 0 && <p className="text-sm text-mid">No sections available. Add sections first.</p>}
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-white border border-border rounded-md p-4">
          <h3 className="text-sm font-semibold text-navy mb-3">2. Select Subjects</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {subjects.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm text-navy cursor-pointer hover:bg-ghost px-2 py-1 rounded">
                <input type="checkbox" checked={selected.subject_ids.includes(s.id)} onChange={() => toggleId('subject_ids', s.id)} className="rounded" />
                {s.name} ({s.code}) - {s.sessions_required} session(s)
              </label>
            ))}
            {subjects.length === 0 && <p className="text-sm text-mid">No subjects available. Add subjects first.</p>}
          </div>
        </div>

        {/* Labs */}
        <div className="bg-white border border-border rounded-md p-4">
          <h3 className="text-sm font-semibold text-navy mb-3">3. Select Laboratories</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {labs.filter((l) => l.is_available).map((l) => (
              <label key={l.id} className="flex items-center gap-2 text-sm text-navy cursor-pointer hover:bg-ghost px-2 py-1 rounded">
                <input type="checkbox" checked={selected.lab_ids.includes(l.id)} onChange={() => toggleId('lab_ids', l.id)} className="rounded" />
                {l.name} (Capacity: {l.capacity})
              </label>
            ))}
          </div>
        </div>

        {/* Faculty */}
        <div className="bg-white border border-border rounded-md p-4">
          <h3 className="text-sm font-semibold text-navy mb-3">4. Select Faculty</h3>
          <p className="text-xs text-mid mb-2">At least 2 faculty members required (In-Charge + Co-In-Charge)</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {faculty.filter((f) => f.is_available).map((f) => (
              <label key={f.id} className="flex items-center gap-2 text-sm text-navy cursor-pointer hover:bg-ghost px-2 py-1 rounded">
                <input type="checkbox" checked={selected.faculty_ids.includes(f.id)} onChange={() => toggleId('faculty_ids', f.id)} className="rounded" />
                {f.name} (Load: {f.current_load}/{f.max_load})
              </label>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        <div className="bg-white border border-border rounded-md p-4">
          <h3 className="text-sm font-semibold text-navy mb-3">5. Select Time Slots</h3>
          <div className="space-y-1">
            {timeSlots.map((ts) => (
              <label key={ts.id} className="flex items-center gap-2 text-sm text-navy cursor-pointer hover:bg-ghost px-2 py-1 rounded">
                <input type="checkbox" checked={selected.time_slot_ids.includes(ts.id)} onChange={() => toggleId('time_slot_ids', ts.id)} className="rounded" />
                {ts.label}: {ts.start_time} - {ts.end_time}
              </label>
            ))}
            {timeSlots.length === 0 && <p className="text-sm text-mid">No time slots. Add them first.</p>}
          </div>
        </div>

        {/* Dates */}
        <div className="bg-white border border-border rounded-md p-4">
          <h3 className="text-sm font-semibold text-navy mb-3">6. Select Exam Dates</h3>
          <div className="flex gap-2 mb-3">
            <input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} className="flex-1 px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
            <button onClick={addDate} className="px-3 py-2 text-sm bg-steel text-white rounded hover:bg-steel-dark transition-colors">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selected.exam_dates.sort().map((d) => (
              <span key={d} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-ice text-navy rounded border border-border">
                {d}
                <button onClick={() => removeDate(d)} className="text-mid hover:text-red-600">&times;</button>
              </span>
            ))}
            {selected.exam_dates.length === 0 && <p className="text-sm text-mid">No dates selected</p>}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || generating}
          className={`px-6 py-3 text-sm font-medium rounded transition-colors ${
            canGenerate && !generating
              ? 'bg-bright text-white hover:opacity-90'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {generating ? 'Generating Schedule...' : 'GENERATE AUTOMATIC SCHEDULE'}
        </button>
        {!canGenerate && (
          <p className="text-xs text-mid">Select at least: 1 section, 1 subject, 1 lab, 2 faculty, 1 time slot, 1 date</p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-border rounded-md p-4">
              <p className="text-xs text-mid uppercase">Scheduled</p>
              <p className="text-2xl font-semibold text-green-700 mt-1">{result.total_scheduled}</p>
            </div>
            <div className="bg-white border border-border rounded-md p-4">
              <p className="text-xs text-mid uppercase">Unscheduled</p>
              <p className="text-2xl font-semibold text-red-600 mt-1">{result.total_unscheduled}</p>
            </div>
            <div className="bg-white border border-border rounded-md p-4">
              <p className="text-xs text-mid uppercase">Conflicts</p>
              <p className="text-2xl font-semibold text-amber-600 mt-1">{result.conflicts?.length || 0}</p>
            </div>
          </div>

          {/* Scheduled Exams Table */}
          {result.scheduled?.length > 0 && (
            <div className="bg-white border border-border rounded-md overflow-x-auto">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-base font-semibold text-navy">Generated Schedule</h3>
              </div>
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Main In-Charge (Coordinator)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Co-In-Charge</th>

                  </tr>
                </thead>
                <tbody>
                  {result.scheduled.map((s, i) => (
                    <tr key={s.id} className={`border-t border-border ${i % 2 === 1 ? 'bg-ghost' : 'bg-white'}`}>
                      <td className="px-4 py-3 font-medium">{s.exam_date}</td>
                      <td className="px-4 py-3">{s.start_time} - {s.end_time}</td>
                      <td className="px-4 py-3">{s.class_name}</td>
                      <td className="px-4 py-3">{s.section_name}</td>
                      <td className="px-4 py-3">{s.batch_name}</td>
                      <td className="px-4 py-3">{s.subject_name}</td>
                      <td className="px-4 py-3">{s.lab_name}</td>
                      <td className="px-4 py-3">{s.incharge_name}</td>
                      <td className="px-4 py-3">{s.co_incharge_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Unscheduled Items */}
          {result.unscheduled?.length > 0 && (
            <div className="bg-white border border-red-200 rounded-md p-5">
              <h3 className="text-base font-semibold text-red-700 mb-3">Unscheduled Items</h3>
              <div className="space-y-3">
                {result.unscheduled.map((u, i) => {
                  const sec = sections.find((s) => s.id === u.section_id);
                  const sub = subjects.find((s) => s.id === u.subject_id);
                  const btc = batches.find((b) => b.id === u.batch_id);
                  const secLabel = sec ? `${sec.class_name || ''} Sec ${sec.name}` : `Section #${u.section_id}`;
                  const batchLabel = btc ? btc.name : `Batch #${u.batch_id}`;
                  const subLabel = sub ? sub.name : `Subject #${u.subject_id}`;
                  return (
                    <div key={i} className="border border-red-100 rounded p-3.5 bg-red-50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-red-800">
                          {secLabel} • {batchLabel} • {subLabel} (Session {u.session_number})
                        </p>
                        <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded font-medium">
                          Session {u.session_number}
                        </span>
                      </div>
                      <ul className="mt-1.5 text-xs text-red-700 list-disc list-inside space-y-0.5">
                        {u.reasons.map((r, j) => <li key={j}>{r}</li>)}
                      </ul>
                      {u.session_number > 1 && (
                        <div className="mt-2 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded p-2">
                          💡 <strong>Why is Session {u.session_number} requested?</strong> In <em>Subjects</em>, <strong>{subLabel}</strong> has <em>Sessions Required</em> set to <strong>{sub?.sessions_required || u.session_number}</strong>. If each batch only takes this practical exam <strong>once</strong>, go to <a href="/subjects" className="underline font-semibold text-steel">Subjects</a> and change <em>Sessions Required</em> to <strong>1</strong>.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
