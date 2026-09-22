import { useState, useEffect } from 'react';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active view tab: 'subjects' | 'coordinators'
  const [activeTab, setActiveTab] = useState('subjects');

  // Selected subject for Class & Section coordinators table
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [coordinators, setCoordinators] = useState([]);
  const [coordinatorChanges, setCoordinatorChanges] = useState({});
  const [coordinatorsLoading, setCoordinatorsLoading] = useState(false);
  const [savingCoordinators, setSavingCoordinators] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Add / Edit Subject modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    sessions_required: 1,
    duration_minutes: 180,
    required_lab_type: '',
    department_id: '',
    faculty_id: '',
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/subjects'),
      api.get('/departments'),
      api.get('/laboratories'),
      api.get('/faculty'),
    ])
      .then(([s, d, l, f]) => {
        setSubjects(s || []);
        setDepartments(d || []);
        setLaboratories(l || []);
        setFaculty(f || []);
        if (s && s.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(s[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Fetch section coordinators when selected subject changes
  const loadCoordinators = async (subjId) => {
    if (!subjId) return;
    setCoordinatorsLoading(true);
    try {
      const data = await api.get(`/subjects/${subjId}/coordinators`);
      setCoordinators(data || []);
      const initialMap = {};
      (data || []).forEach((c) => {
        initialMap[c.section_id] = c.is_custom && c.faculty_id ? String(c.faculty_id) : '';
      });
      setCoordinatorChanges(initialMap);
    } catch (err) {
      console.error(err);
    } finally {
      setCoordinatorsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSubjectId) {
      loadCoordinators(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  const openAdd = () => {
    setEditItem(null);
    setForm({
      name: '',
      code: '',
      sessions_required: 1,
      duration_minutes: 180,
      required_lab_type: '',
      department_id: departments[0]?.id || '',
      faculty_id: '',
    });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditItem(row);
    setForm({
      name: row.name,
      code: row.code,
      sessions_required: row.sessions_required,
      duration_minutes: row.duration_minutes,
      required_lab_type: row.required_lab_type || '',
      department_id: row.department_id,
      faculty_id: row.faculty_id || '',
    });
    setModalOpen(true);
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      department_id: Number(form.department_id),
      faculty_id: form.faculty_id ? Number(form.faculty_id) : null,
      sessions_required: Number(form.sessions_required) || 1,
      duration_minutes: Number(form.duration_minutes) || 180,
    };
    if (editItem) {
      await api.put(`/subjects/${editItem.id}`, payload);
    } else {
      await api.post('/subjects', payload);
    }
    setModalOpen(false);
    load();
  };

  const handleDeleteSubject = async (row) => {
    if (confirm(`Delete subject "${row.name}"?`)) {
      await api.del(`/subjects/${row.id}`);
      load();
    }
  };

  // ── Section Coordinators Handlers ──────────────────────────────────────────
  const handleCoordinatorChange = (sectionId, value) => {
    setCoordinatorChanges((prev) => ({
      ...prev,
      [sectionId]: value,
    }));
  };

  const handleSaveAllCoordinators = async () => {
    if (!selectedSubjectId) return;
    setSavingCoordinators(true);
    try {
      const payload = Object.entries(coordinatorChanges).map(([secId, facId]) => ({
        section_id: Number(secId),
        faculty_id: facId ? Number(facId) : null,
      }));
      const updated = await api.put(`/subjects/${selectedSubjectId}/coordinators`, payload);
      setCoordinators(updated || []);
      setSaveMessage('All section coordinators updated successfully.');
      setTimeout(() => setSaveMessage(''), 3500);
      load();
    } catch (err) {
      console.error(err);
      alert('Failed to save section coordinators.');
    } finally {
      setSavingCoordinators(false);
    }
  };

  const handleSaveSingleCoordinator = async (sectionId) => {
    if (!selectedSubjectId) return;
    try {
      const facId = coordinatorChanges[sectionId];
      const payload = {
        section_id: Number(sectionId),
        faculty_id: facId ? Number(facId) : null,
      };
      const updated = await api.put(
        `/subjects/${selectedSubjectId}/coordinators/${sectionId}`,
        payload
      );
      setCoordinators((prev) =>
        prev.map((item) => (item.section_id === sectionId ? updated : item))
      );
      setSaveMessage(`Section ${updated.section_name} coordinator updated.`);
      setTimeout(() => setSaveMessage(''), 3500);
      load();
    } catch (err) {
      console.error(err);
      alert('Failed to update section coordinator.');
    }
  };

  const handleResetAllToDefault = () => {
    const resetMap = {};
    coordinators.forEach((c) => {
      resetMap[c.section_id] = '';
    });
    setCoordinatorChanges(resetMap);
  };

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  const columns = [
    { key: 'name', label: 'Subject Name' },
    { key: 'code', label: 'Code' },
    { key: 'sessions_required', label: 'Sessions' },
    { key: 'duration_minutes', label: 'Duration (min)', render: (v) => `${v} min` },
    { key: 'required_lab_type', label: 'Lab Type / Laboratory', render: (v) => v || '—' },
    {
      key: 'faculty_name',
      label: 'Default Coordinator',
      render: (v) => v || <span className="text-mid italic">Unassigned</span>,
    },
    { key: 'department_name', label: 'Department' },
  ];

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-navy mb-6">Subjects / Labs</h1>
        <SkeletonLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-navy">Subjects / Labs</h1>
          <p className="text-xs text-mid mt-0.5">
            Configure laboratory courses, duration parameters, and section-specific subject coordinators.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openAdd}
            className="px-4 py-2 text-sm bg-steel text-white rounded hover:bg-steel-dark transition-colors font-medium shadow-sm"
          >
            + Add Subject
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('subjects')}
            className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'subjects'
                ? 'border-steel text-navy'
                : 'border-transparent text-mid hover:text-navy'
            }`}
          >
            All Subjects &amp; Labs ({subjects.length})
          </button>
          <button
            onClick={() => setActiveTab('coordinators')}
            className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'coordinators'
                ? 'border-steel text-navy'
                : 'border-transparent text-mid hover:text-navy'
            }`}
          >
            Class &amp; Section Coordinators
          </button>
        </div>
      </div>

      {/* ── TAB 1: ALL SUBJECTS & LABS ─────────────────────────────────────────── */}
      {activeTab === 'subjects' && (
        <div>
          <DataTable
            columns={columns}
            data={subjects}
            onEdit={openEdit}
            onDelete={handleDeleteSubject}
            emptyMessage="No subjects added yet"
          />
        </div>
      )}

      {/* ── TAB 2: CLASS & SECTION COORDINATORS TABLE ───────────────────────────── */}
      {activeTab === 'coordinators' && (
        <div className="space-y-5">
          {/* Subject Selector Bar */}
          <div className="bg-white border border-border rounded-lg p-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-mid mb-1">
                  Select Subject / Lab Course
                </label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSubjectId(s.id)}
                      className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                        selectedSubjectId === s.id
                          ? 'bg-navy text-white shadow-sm'
                          : 'bg-ice text-navy border border-border hover:bg-ghost'
                      }`}
                    >
                      {s.name} <span className="opacity-75">({s.code})</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedSubject && (
                <div className="flex items-center gap-2 self-start md:self-auto text-xs bg-ghost border border-border rounded-md px-3 py-2">
                  <div>
                    <span className="text-mid font-medium">Default Coordinator:</span>{' '}
                    <strong className="text-navy">
                      {selectedSubject.faculty_name || 'Unassigned'}
                    </strong>
                  </div>
                  <span className="text-border">|</span>
                  <div>
                    <span className="text-mid font-medium">Department:</span>{' '}
                    <span className="text-navy">{selectedSubject.department_name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Teaching Class Sections Summary */}
            {selectedSubject && selectedSubject.teaching_sections && selectedSubject.teaching_sections.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs font-semibold text-mid uppercase tracking-wide mb-1.5">
                  Teaching Class Sections for this Subject ({selectedSubject.teaching_sections.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedSubject.teaching_sections.map((ts) => (
                    <div
                      key={ts.section_id}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-ice text-navy border border-border rounded-md"
                    >
                      <span className="font-semibold text-navy">{ts.class_name}</span>
                      <span className="bg-white border border-border rounded px-1.5 py-0.5 text-[11px] font-medium">
                        Sec {ts.section_name}
                      </span>
                      <span className="text-[11px] text-mid">
                        Main In-Charge:{' '}
                        {ts.coordinator_name ? (
                          <strong className="text-navy">{ts.coordinator_name}</strong>
                        ) : (
                          <span className="italic">Unassigned</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Description Banner */}
          <div className="bg-ice/60 border border-border rounded-lg p-4 text-xs text-navy flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-sm text-navy mb-0.5">
                Class Practical Main In-Charge Assignment Table
              </p>
              <p className="text-mid">
                For each subject and class section, the coordinator selected below will be strictly allotted as the <strong>Main In-Charge</strong> for that class practical exam session.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleResetAllToDefault}
                className="px-3 py-1.5 text-xs border border-border rounded bg-white hover:bg-ghost font-medium text-navy transition-colors"
                title="Reset all sections to inherit the subject's default coordinator"
              >
                Reset All to Default
              </button>
              <button
                onClick={handleSaveAllCoordinators}
                disabled={savingCoordinators}
                className="px-4 py-1.5 text-xs bg-steel text-white rounded hover:bg-steel-dark transition-colors font-medium shadow-sm disabled:opacity-50"
              >
                {savingCoordinators ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {saveMessage && (
            <div className="px-4 py-2 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-medium transition-all">
              {saveMessage}
            </div>
          )}

          {/* Class & Section Table */}
          {coordinatorsLoading ? (
            <SkeletonLoader />
          ) : coordinators.length === 0 ? (
            <div className="text-center py-10 border border-border rounded-lg bg-white text-mid text-sm">
              No classes or sections found for this subject&apos;s department.
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-lg bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ice border-b border-border text-navy text-xs font-semibold uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Class Name</th>
                    <th className="px-4 py-3 text-left">Year / Semester</th>
                    <th className="px-4 py-3 text-left">Section</th>
                    <th className="px-4 py-3 text-left">Students</th>
                    <th className="px-4 py-3 text-left">Allotted Main In-Charge (Coordinator)</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {coordinators.map((c, idx) => {
                    const currentVal =
                      coordinatorChanges[c.section_id] !== undefined
                        ? coordinatorChanges[c.section_id]
                        : c.is_custom && c.faculty_id
                        ? String(c.faculty_id)
                        : '';
                    const isCustomNow = Boolean(currentVal);

                    return (
                      <tr
                        key={c.section_id}
                        className={`hover:bg-ice/50 transition-colors ${
                          idx % 2 === 1 ? 'bg-ghost/30' : 'bg-white'
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-navy">{c.class_name}</td>
                        <td className="px-4 py-3 text-mid">{c.year_semester || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-navy">Section {c.section_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 bg-ghost border border-border rounded font-medium text-navy">
                            {c.student_count} students
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={currentVal}
                            onChange={(e) => handleCoordinatorChange(c.section_id, e.target.value)}
                            className="w-full max-w-sm px-2.5 py-1.5 text-xs border border-border rounded bg-white focus:outline-none focus:border-steel font-medium text-navy"
                          >
                            <option value="">
                              Default ({selectedSubject?.faculty_name || 'Unassigned'})
                            </option>
                            {faculty.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name} ({f.faculty_id_code})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {isCustomNow ? (
                            <span className="inline-flex items-center text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-medium">
                              Main In-Charge (Section)
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] px-2 py-0.5 bg-ghost text-mid border border-border rounded-full font-medium">
                              Main In-Charge (Default)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleSaveSingleCoordinator(c.section_id)}
                            className="text-xs px-2.5 py-1 rounded bg-white border border-border text-navy hover:bg-ice font-medium transition-colors"
                          >
                            Save
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ADD / EDIT SUBJECT MODAL ────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Subject' : 'Add Subject'}
      >
        <form onSubmit={handleSaveSubject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Department</label>
            <select
              required
              value={form.department_id}
              onChange={(e) => setForm({ ...form, department_id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel bg-white"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Subject Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Code</label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">
                Sessions Required (per Batch)
              </label>
              <input
                type="number"
                min="1"
                required
                value={form.sessions_required}
                onChange={(e) => setForm({ ...form, sessions_required: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
              />
              <p className="text-[11px] text-mid mt-1">
                Usually 1 session per batch. The scheduler allocates each batch automatically.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Duration (minutes)</label>
              <input
                type="number"
                min="30"
                required
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">
                Required Lab Type / Laboratory
              </label>
              <input
                type="text"
                list="lab-options"
                value={form.required_lab_type}
                onChange={(e) => setForm({ ...form, required_lab_type: e.target.value })}
                placeholder="Select or enter Lab Name / Type"
                className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
              />
              <datalist id="lab-options">
                {laboratories.map((l) => (
                  <option key={`lab-${l.id}`} value={l.name}>
                    {l.name} ({l.lab_type || 'General'})
                  </option>
                ))}
                {Array.from(new Set(laboratories.map((l) => l.lab_type).filter(Boolean))).map(
                  (lt) => (
                    <option key={`type-${lt}`} value={lt}>
                      {lt}
                    </option>
                  )
                )}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">
                Main / Default Coordinator
              </label>
              <select
                value={form.faculty_id}
                onChange={(e) => setForm({ ...form, faculty_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel bg-white"
              >
                <option value="">Select Default Coordinator</option>
                {faculty.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.faculty_id_code})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm border border-border rounded hover:bg-ghost transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-steel text-white rounded hover:bg-steel-dark transition-colors font-medium"
            >
              Save Subject
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

