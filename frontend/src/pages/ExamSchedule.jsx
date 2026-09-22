import { useState, useEffect } from 'react';
import api from '../api/client';
import SkeletonLoader from '../components/SkeletonLoader';
import Modal from '../components/Modal';

export default function ExamSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [editError, setEditError] = useState('');

  // Lookup data for edit modal & view filters
  const [timeSlots, setTimeSlots] = useState([]);
  const [labs, setLabs] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [sections, setSections] = useState([]);
  const [batches, setBatches] = useState([]);

  // View Mode: 'all' | 'class' | 'faculty' | 'lab'
  const [viewMode, setViewMode] = useState('all');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedLabId, setSelectedLabId] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/scheduler/schedules'),
      api.get('/time-slots'),
      api.get('/laboratories'),
      api.get('/faculty'),
      api.get('/sections'),
      api.get('/batches'),
    ])
      .then(([sch, ts, lb, fac, sec, btc]) => {
        setSchedules(sch || []);
        setTimeSlots(ts || []);
        setLabs(lb || []);
        setFaculty(fac || []);
        setSections(sec || []);
        setBatches(btc || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openEdit = (s) => {
    setEditItem(s);
    setEditError('');
    setForm({
      exam_date: s.exam_date,
      time_slot_id: s.time_slot_id,
      lab_id: s.lab_id,
      batch_id: s.batch_id,
      incharge_id: s.incharge_id,
      co_incharge_id: s.co_incharge_id,
    });
    setEditModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setEditError('');

    const labId = Number(form.lab_id);
    const inchargeId = Number(form.incharge_id);
    const coInchargeId = Number(form.co_incharge_id);
    const batchId = Number(form.batch_id || editItem.batch_id);

    // Validate Rule 10: In-Charge != Co-In-Charge
    if (inchargeId === coInchargeId) {
      setEditError('In-Charge and Co-In-Charge cannot be the same faculty member.');
      return;
    }

    // Validate Rule 4: Lab Capacity >= Batch Size
    const selectedLab = labs.find((l) => l.id === labId);
    const currentBatch = batches.find((b) => b.id === batchId);
    if (selectedLab && currentBatch && selectedLab.capacity < currentBatch.size) {
      setEditError(
        `Selected laboratory (${selectedLab.name}, capacity: ${selectedLab.capacity}) cannot accommodate ${currentBatch.name} (${currentBatch.size} students).`
      );
      return;
    }

    const payload = {
      exam_date: form.exam_date,
      time_slot_id: Number(form.time_slot_id),
      lab_id: labId,
      batch_id: batchId,
      incharge_id: inchargeId,
      co_incharge_id: coInchargeId,
    };

    try {
      await api.put(`/scheduler/schedules/${editItem.id}`, payload);
      setEditModal(false);
      load();
    } catch (err) {
      setEditError(err.message || 'Failed to update schedule');
    }
  };

  const handleDelete = async (s) => {
    if (confirm('Delete this schedule entry?')) {
      await api.del(`/scheduler/schedules/${s.id}`);
      load();
    }
  };

  const clearAll = async () => {
    if (confirm('Clear ALL scheduled exams? This will reset faculty workloads.')) {
      await api.del('/scheduler/schedules');
      load();
    }
  };

  // Filter schedules based on active view mode
  let filteredSchedules = schedules;
  if (viewMode === 'class' && selectedSectionId) {
    filteredSchedules = schedules.filter((s) => s.section_id === Number(selectedSectionId));
  } else if (viewMode === 'faculty' && selectedFacultyId) {
    const fid = Number(selectedFacultyId);
    filteredSchedules = schedules.filter((s) => s.incharge_id === fid || s.co_incharge_id === fid);
  } else if (viewMode === 'lab' && selectedLabId) {
    filteredSchedules = schedules.filter((s) => s.lab_id === Number(selectedLabId));
  }

  if (loading) return <div><h1 className="text-xl font-semibold text-navy mb-6">Exam Schedule</h1><SkeletonLoader rows={8} cols={9} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-navy">Practical Exam Schedule</h1>
          <p className="text-xs text-mid mt-0.5">View, filter by Class/Faculty/Lab, and manually adjust examination timetable allocations.</p>
        </div>
        {schedules.length > 0 && (
          <button onClick={clearAll} className="px-4 py-2 text-xs font-medium border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors">
            Clear All Schedules
          </button>
        )}
      </div>

      {/* View Switcher Tabs */}
      <div className="bg-white border border-border rounded-md p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'Complete Schedule' },
              { key: 'class', label: 'Class-wise View' },
              { key: 'faculty', label: 'Faculty-wise View' },
              { key: 'lab', label: 'Lab-wise View' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                  viewMode === tab.key ? 'bg-steel text-white border-steel' : 'bg-white text-navy border-border hover:bg-ghost'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Conditional Filters inside View Tabs */}
          {viewMode === 'class' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-navy font-medium">Select Section:</label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="px-3 py-1.5 text-xs border border-border rounded bg-white focus:outline-none focus:border-steel"
              >
                <option value="">All Classes & Sections</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>{s.class_name} - Section {s.name}</option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'faculty' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-navy font-medium">Select Faculty:</label>
              <select
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="px-3 py-1.5 text-xs border border-border rounded bg-white focus:outline-none focus:border-steel"
              >
                <option value="">All Faculty</option>
                {faculty.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.faculty_id_code})</option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'lab' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-navy font-medium">Select Laboratory:</label>
              <select
                value={selectedLabId}
                onChange={(e) => setSelectedLabId(e.target.value)}
                className="px-3 py-1.5 text-xs border border-border rounded bg-white focus:outline-none focus:border-steel"
              >
                <option value="">All Laboratories</option>
                {labs.map((l) => (
                  <option key={l.id} value={l.id}>{l.name} (Cap: {l.capacity})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Table */}
      {filteredSchedules.length === 0 ? (
        <div className="bg-white border border-border rounded-md px-5 py-12 text-center">
          <p className="text-mid text-sm">
            {schedules.length === 0
              ? 'No exams scheduled. Use the Auto Scheduler to generate a schedule.'
              : 'No examination records match the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-md overflow-x-auto">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-ice">
            <h2 className="text-sm font-semibold text-navy">
              {viewMode === 'all' && 'PRACTICAL EXAMINATION SCHEDULE (ALL)'}
              {viewMode === 'class' && 'CLASS-WISE PRACTICAL EXAMINATION SCHEDULE'}
              {viewMode === 'faculty' && 'FACULTY-WISE PRACTICAL EXAMINATION SCHEDULE'}
              {viewMode === 'lab' && 'LAB-WISE PRACTICAL EXAMINATION SCHEDULE'}
            </h2>
            <span className="text-xs text-mid">{filteredSchedules.length} Exam Entries</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ghost border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Class</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Section</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Batch</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Venue</th>
                {viewMode === 'faculty' && selectedFacultyId ? (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Assigned Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Co-Faculty</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Main In-Charge</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Co-In-Charge</th>
                  </>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((s, i) => {
                const isFacultyView = viewMode === 'faculty' && selectedFacultyId;
                const fid = Number(selectedFacultyId);
                const role = s.incharge_id === fid ? 'In-Charge' : s.co_incharge_id === fid ? 'Co-In-Charge' : 'Faculty';
                const coFacultyName = s.incharge_id === fid ? s.co_incharge_name : s.incharge_name;

                return (
                  <tr key={s.id} className={`border-t border-border ${i % 2 === 1 ? 'bg-ghost/30' : 'bg-white'} hover:bg-ice/50 transition-colors`}>
                    <td className="px-4 py-3 font-medium text-navy">{s.exam_date}</td>
                    <td className="px-4 py-3">{s.start_time} - {s.end_time}</td>
                    <td className="px-4 py-3">{s.class_name}</td>
                    <td className="px-4 py-3">{s.section_name}</td>
                    <td className="px-4 py-3 font-medium">{s.batch_name}</td>
                    <td className="px-4 py-3 text-steel-dark font-medium">{s.subject_name}</td>
                    <td className="px-4 py-3">{s.lab_name}</td>
                    {isFacultyView ? (
                      <>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${role === 'In-Charge' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                            {role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-mid">{coFacultyName}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium">{s.incharge_name}</td>
                        <td className="px-4 py-3 text-mid">{s.co_incharge_name}</td>
                      </>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(s)} className="text-xs px-2.5 py-1 rounded bg-steel text-white hover:bg-steel-dark transition-colors">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(s)} className="text-xs px-2.5 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors">
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Manual Edit Schedule Entry">
        <form onSubmit={handleSave} className="space-y-4">
          {editError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {editError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-navy uppercase mb-1">Exam Date</label>
            <input
              type="date"
              required
              value={form.exam_date || ''}
              onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy uppercase mb-1">Time Slot</label>
            <select
              value={form.time_slot_id || ''}
              onChange={(e) => setForm({ ...form, time_slot_id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
            >
              {timeSlots.map((ts) => (
                <option key={ts.id} value={ts.id}>{ts.label}: {ts.start_time} - {ts.end_time}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy uppercase mb-1">Laboratory / Venue</label>
            <select
              value={form.lab_id || ''}
              onChange={(e) => setForm({ ...form, lab_id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
            >
              {labs.map((l) => (
                <option key={l.id} value={l.id}>{l.name} (Capacity: {l.capacity})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy uppercase mb-1">Batch</label>
            <select
              value={form.batch_id || ''}
              onChange={(e) => setForm({ ...form, batch_id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.class_name} - {b.section_name} - {b.name} ({b.size} students)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy uppercase mb-1">Main In-Charge Faculty</label>
            <select
              value={form.incharge_id || ''}
              onChange={(e) => setForm({ ...form, incharge_id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
            >
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>{f.name} (Load: {f.current_load}/{f.max_load})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy uppercase mb-1">Co-In-Charge Faculty</label>
            <select
              value={form.co_incharge_id || ''}
              onChange={(e) => setForm({ ...form, co_incharge_id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
            >
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>{f.name} (Load: {f.current_load}/{f.max_load})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditModal(false)}
              className="px-4 py-2 text-sm border border-border rounded hover:bg-ghost transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-steel text-white rounded hover:bg-steel-dark transition-colors"
            >
              Save & Verify
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

