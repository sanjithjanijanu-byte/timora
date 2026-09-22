import { useState, useEffect } from 'react';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Faculty() {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Faculty modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    name: '',
    faculty_id_code: '',
    department_id: '',
    expertise: '',
    max_load: 5,
    is_available: true,
  });

  // Assign Class & Batch modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedFacultyForAssign, setSelectedFacultyForAssign] = useState(null);
  const [assignForm, setAssignForm] = useState({
    subject_id: '',
    class_id: '',
    section_id: '',
    batch_id: 'all',
  });
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/faculty'),
      api.get('/departments'),
      api.get('/classes'),
      api.get('/sections'),
      api.get('/batches'),
      api.get('/subjects'),
    ])
      .then(([f, d, c, s, b, subjs]) => {
        setFaculty(f || []);
        setDepartments(d || []);
        setClasses(c || []);
        setSections(s || []);
        setBatches(b || []);
        setSubjects(subjs || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // ── Faculty CRUD ────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditItem(null);
    setForm({
      name: '',
      faculty_id_code: '',
      department_id: departments[0]?.id || '',
      expertise: '',
      max_load: 5,
      is_available: true,
    });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditItem(row);
    setForm({
      name: row.name,
      faculty_id_code: row.faculty_id_code,
      department_id: row.department_id,
      expertise: row.expertise || '',
      max_load: row.max_load,
      is_available: row.is_available,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      department_id: Number(form.department_id),
      max_load: Number(form.max_load),
    };
    if (editItem) {
      await api.put(`/faculty/${editItem.id}`, payload);
    } else {
      await api.post('/faculty', payload);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (row) => {
    if (confirm(`Delete faculty "${row.name}"?`)) {
      await api.del(`/faculty/${row.id}`);
      load();
    }
  };

  // ── Class & Batch Assignment Handlers ───────────────────────────────────────
  const openAssignModal = (facultyRow) => {
    setSelectedFacultyForAssign(facultyRow);
    setAssignError('');

    // Prepopulate first available class and its first section if available
    const initialClassId = classes[0]?.id ? String(classes[0].id) : '';
    const initialSections = initialClassId
      ? sections.filter((s) => s.class_id === Number(initialClassId))
      : [];
    const initialSectionId = initialSections[0]?.id ? String(initialSections[0].id) : '';

    setAssignForm({
      subject_id: subjects[0]?.id ? String(subjects[0].id) : '',
      class_id: initialClassId,
      section_id: initialSectionId,
      batch_id: 'all',
    });
    setAssignModalOpen(true);
  };

  const handleClassChange = (newClassId) => {
    const classSections = sections.filter((s) => s.class_id === Number(newClassId));
    const firstSecId = classSections[0]?.id ? String(classSections[0].id) : '';
    setAssignForm((prev) => ({
      ...prev,
      class_id: newClassId,
      section_id: firstSecId,
      batch_id: 'all',
    }));
  };

  const handleSectionChange = (newSecId) => {
    setAssignForm((prev) => ({
      ...prev,
      section_id: newSecId,
      batch_id: 'all',
    }));
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!selectedFacultyForAssign || !assignForm.subject_id || !assignForm.section_id) {
      setAssignError('Please select both a Subject and a Section.');
      return;
    }
    setAssignLoading(true);
    setAssignError('');
    try {
      const payload = {
        subject_id: Number(assignForm.subject_id),
        section_id: Number(assignForm.section_id),
        batch_id:
          assignForm.batch_id && assignForm.batch_id !== 'all'
            ? Number(assignForm.batch_id)
            : null,
      };
      const updatedAssignments = await api.post(
        `/faculty/${selectedFacultyForAssign.id}/assignments`,
        payload
      );
      setSelectedFacultyForAssign((prev) => ({
        ...prev,
        assigned_classes: updatedAssignments,
      }));
      setFaculty((prev) =>
        prev.map((f) =>
          f.id === selectedFacultyForAssign.id
            ? { ...f, assigned_classes: updatedAssignments }
            : f
        )
      );
    } catch (err) {
      console.error(err);
      setAssignError(err.message || 'Failed to assign class and batch.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!selectedFacultyForAssign) return;
    if (!confirm('Remove this class and batch assignment?')) return;
    try {
      const updatedAssignments = await api.del(
        `/faculty/${selectedFacultyForAssign.id}/assignments/${assignmentId}`
      );
      setSelectedFacultyForAssign((prev) => ({
        ...prev,
        assigned_classes: updatedAssignments,
      }));
      setFaculty((prev) =>
        prev.map((f) =>
          f.id === selectedFacultyForAssign.id
            ? { ...f, assigned_classes: updatedAssignments }
            : f
        )
      );
    } catch (err) {
      console.error(err);
      alert('Failed to remove assignment: ' + (err.message || 'Unknown error'));
    }
  };

  // Filter sections and batches for the current form selection
  const availableSections = assignForm.class_id
    ? sections.filter((s) => s.class_id === Number(assignForm.class_id))
    : [];

  const availableBatches = assignForm.section_id
    ? batches.filter((b) => b.section_id === Number(assignForm.section_id))
    : [];

  const columns = [
    { key: 'name', label: 'Faculty Name' },
    { key: 'faculty_id_code', label: 'ID' },
    { key: 'department_name', label: 'Department' },
    {
      key: 'class_batch',
      label: 'Class & Batch (Practical In-Charge)',
      render: (_, row) => {
        const assignments = row.assigned_classes || [];
        return (
          <div className="flex flex-col gap-1.5 py-1 min-w-[220px]">
            <div className="flex flex-wrap gap-1.5 items-center">
              {assignments.length === 0 ? (
                <span className="text-mid italic text-xs">No class/batch assigned</span>
              ) : (
                assignments.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-ghost border border-border text-navy font-medium shadow-xs"
                    title={`${a.class_name} (${a.section_name}) - ${a.batch_name} for ${a.subject_name}`}
                  >
                    <span>{a.class_name} ({a.section_name})</span>
                    <span className="text-mid">/</span>
                    <span className="text-steel font-semibold">{a.batch_name}</span>
                    <span className="text-mid">/</span>
                    <span className="text-navy">{a.subject_name}</span>
                  </span>
                ))
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openAssignModal(row);
                }}
                className="inline-flex items-center gap-1 text-xs text-steel hover:text-steel-dark font-medium underline transition-colors cursor-pointer"
              >
                + Assign Class &amp; Batch
              </button>
            </div>
          </div>
        );
      },
    },
    { key: 'expertise', label: 'Expertise' },
    { key: 'max_load', label: 'Max Load' },
    { key: 'current_load', label: 'Current Load' },
    {
      key: 'is_available',
      label: 'Available',
      render: (val) => (
        <span
          className={`inline-block px-2 py-0.5 text-xs rounded ${
            val
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {val ? 'Yes' : 'No'}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-navy mb-6">Faculty</h1>
        <SkeletonLoader />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-navy">Faculty</h1>
          <p className="text-xs text-mid mt-0.5">
            Manage teaching staff profiles and configure class &amp; batch practical exam in-charge responsibilities.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 text-sm bg-steel text-white rounded hover:bg-steel-dark transition-colors font-medium shadow-sm"
        >
          + Add Faculty
        </button>
      </div>

      <DataTable
        columns={columns}
        data={faculty}
        onEdit={openEdit}
        onDelete={handleDelete}
        emptyMessage="No faculty added yet"
      />

      {/* ── MODAL: Add / Edit Faculty Profile ─────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Faculty' : 'Add Faculty'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Department</label>
            <select
              required
              value={form.department_id}
              onChange={(e) => setForm({ ...form, department_id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
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
              <label className="block text-sm font-medium text-navy mb-1">Faculty Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Faculty ID</label>
              <input
                type="text"
                required
                value={form.faculty_id_code}
                onChange={(e) => setForm({ ...form, faculty_id_code: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Expertise</label>
            <input
              type="text"
              value={form.expertise}
              onChange={(e) => setForm({ ...form, expertise: e.target.value })}
              placeholder="e.g., Networking, DBMS, OS"
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Max Exam Load</label>
              <input
                type="number"
                min="1"
                required
                value={form.max_load}
                onChange={(e) => setForm({ ...form, max_load: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-navy cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                  className="rounded"
                />
                Available for exams
              </label>
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
              className="px-4 py-2 text-sm bg-steel text-white rounded hover:bg-steel-dark transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: Assign Class & Batch as Main In-Charge ─────────────────────── */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={
          selectedFacultyForAssign
            ? `Class & Batch Assignments — ${selectedFacultyForAssign.name}`
            : 'Class & Batch Assignments'
        }
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          {/* Note Banner */}
          <div className="p-3 bg-ghost border border-border rounded-md text-xs text-navy leading-relaxed">
            <span className="font-semibold text-steel block mb-0.5">
              Practical Exam Main In-Charge Rule:
            </span>
            Only the respected subject faculty assigned for a class and batch will be allotted as the{' '}
            <span className="font-semibold">Main In-Charge</span> for that class practical examination session.
          </div>

          {/* Section 1: Existing Assignments */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-mid mb-2">
              Current Teaching Assignments ({selectedFacultyForAssign?.assigned_classes?.length || 0})
            </h3>
            {(!selectedFacultyForAssign?.assigned_classes ||
              selectedFacultyForAssign.assigned_classes.length === 0) ? (
              <div className="p-4 border border-dashed border-border rounded-md text-center text-xs text-mid">
                No class and batch assignments yet for this faculty member. Use the form below to assign practicals.
              </div>
            ) : (
              <div className="border border-border rounded-md overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-ghost border-b border-border text-navy font-semibold">
                      <th className="px-3 py-2">Subject / Lab</th>
                      <th className="px-3 py-2">Class &amp; Section</th>
                      <th className="px-3 py-2">Batch</th>
                      <th className="px-3 py-2">Role</th>
                      <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedFacultyForAssign.assigned_classes.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2.5 font-medium text-navy">
                          <div>{a.subject_name}</div>
                          <div className="text-[11px] text-mid">{a.subject_code}</div>
                        </td>
                        <td className="px-3 py-2.5 text-navy">
                          <div>{a.class_name}</div>
                          <div className="text-[11px] text-mid">
                            {a.section_name} {a.year_semester ? `(${a.year_semester})` : ''}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-steel">
                          {a.batch_name}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-block px-2 py-0.5 text-[11px] rounded bg-green-50 text-green-700 border border-green-200 font-semibold">
                            Main In-Charge
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteAssignment(a.id)}
                            className="px-2 py-1 text-[11px] text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 rounded transition-colors font-medium cursor-pointer"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Assign New Class & Batch Form */}
          <div className="pt-3 border-t border-border">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-mid mb-3">
              Assign New Class &amp; Batch
            </h3>
            <form onSubmit={handleAddAssignment} className="space-y-3">
              {assignError && (
                <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded">
                  {assignError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Subject selection */}
                <div>
                  <label className="block text-xs font-medium text-navy mb-1">
                    Subject / Lab Course
                  </label>
                  <select
                    required
                    value={assignForm.subject_id}
                    onChange={(e) =>
                      setAssignForm((prev) => ({ ...prev, subject_id: e.target.value }))
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-border rounded focus:outline-none focus:border-steel bg-white"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class selection */}
                <div>
                  <label className="block text-xs font-medium text-navy mb-1">
                    Class
                  </label>
                  <select
                    required
                    value={assignForm.class_id}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-border rounded focus:outline-none focus:border-steel bg-white"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.year_semester ? `(${c.year_semester})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section selection */}
                <div>
                  <label className="block text-xs font-medium text-navy mb-1">
                    Section
                  </label>
                  <select
                    required
                    value={assignForm.section_id}
                    onChange={(e) => handleSectionChange(e.target.value)}
                    disabled={!assignForm.class_id || availableSections.length === 0}
                    className="w-full px-2.5 py-1.5 text-xs border border-border rounded focus:outline-none focus:border-steel bg-white disabled:bg-slate-100 disabled:text-mid"
                  >
                    <option value="">
                      {!assignForm.class_id
                        ? 'Select Class first'
                        : availableSections.length === 0
                        ? 'No sections for this class'
                        : 'Select Section'}
                    </option>
                    {availableSections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.student_count || 0} students)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Batch selection */}
                <div>
                  <label className="block text-xs font-medium text-navy mb-1">
                    Batch
                  </label>
                  <select
                    value={assignForm.batch_id}
                    onChange={(e) =>
                      setAssignForm((prev) => ({ ...prev, batch_id: e.target.value }))
                    }
                    disabled={!assignForm.section_id}
                    className="w-full px-2.5 py-1.5 text-xs border border-border rounded focus:outline-none focus:border-steel bg-white disabled:bg-slate-100 disabled:text-mid"
                  >
                    <option value="all">All Batches (Whole Section)</option>
                    {availableBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.size} students)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-3 py-1.5 text-xs border border-border rounded hover:bg-ghost transition-colors font-medium"
                >
                  Done
                </button>
                <button
                  type="submit"
                  disabled={assignLoading || !assignForm.subject_id || !assignForm.section_id}
                  className="px-4 py-1.5 text-xs bg-steel text-white rounded hover:bg-steel-dark transition-colors font-medium shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {assignLoading ? 'Assigning...' : '+ Assign as Main In-Charge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
}
