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
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', sessions_required: 1, duration_minutes: 180, required_lab_type: '', department_id: '', faculty_id: '' });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/subjects'),
      api.get('/departments'),
      api.get('/laboratories'),
      api.get('/faculty')
    ])
      .then(([s, d, l, f]) => {
        setSubjects(s);
        setDepartments(d);
        setLaboratories(l);
        setFaculty(f);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', code: '', sessions_required: 1, duration_minutes: 180, required_lab_type: '', department_id: departments[0]?.id || '', faculty_id: '' });
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
      faculty_id: row.faculty_id || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      department_id: Number(form.department_id),
      faculty_id: form.faculty_id ? Number(form.faculty_id) : null,
      sessions_required: Number(form.sessions_required) || 1,
      duration_minutes: Number(form.duration_minutes) || 180
    };
    if (editItem) {
      await api.put(`/subjects/${editItem.id}`, payload);
    } else {
      await api.post('/subjects', payload);
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (row) => {
    if (confirm(`Delete subject "${row.name}"?`)) {
      await api.del(`/subjects/${row.id}`);
      load();
    }
  };

  const columns = [
    { key: 'name', label: 'Subject Name' },
    { key: 'code', label: 'Code' },
    { key: 'sessions_required', label: 'Sessions' },
    { key: 'duration_minutes', label: 'Duration (min)' },
    { key: 'required_lab_type', label: 'Lab Type / Laboratory' },
    { key: 'faculty_name', label: 'Main Coordinator' },
    { key: 'department_name', label: 'Department' },
  ];

  if (loading) return <div><h1 className="text-xl font-semibold text-navy mb-6">Subjects / Labs</h1><SkeletonLoader /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-navy">Subjects / Labs</h1>
        <button onClick={openAdd} className="px-4 py-2 text-sm bg-steel text-white rounded hover:bg-steel-dark transition-colors">Add Subject</button>
      </div>
      <DataTable columns={columns} data={subjects} onEdit={openEdit} onDelete={handleDelete} emptyMessage="No subjects added yet" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Subject' : 'Add Subject'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Department</label>
            <select required value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel">
              <option value="">Select Department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Subject Name</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Code</label>
              <input type="text" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Sessions Required (per Batch)</label>
              <input type="number" min="1" required value={form.sessions_required} onChange={(e) => setForm({ ...form, sessions_required: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
              <p className="text-[11px] text-mid mt-1">Usually 1 session per batch. The scheduler allocates each batch automatically.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Duration (minutes)</label>
              <input type="number" min="30" required value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Required Lab Type / Laboratory</label>
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
                  <option key={`lab-${l.id}`} value={l.name}>{l.name} ({l.lab_type || 'General'})</option>
                ))}
                {Array.from(new Set(laboratories.map((l) => l.lab_type).filter(Boolean))).map((lt) => (
                  <option key={`type-${lt}`} value={lt}>{lt}</option>
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Main Coordinator (Faculty)</label>
              <select
                value={form.faculty_id}
                onChange={(e) => setForm({ ...form, faculty_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
              >
                <option value="">Select Main Coordinator Faculty</option>
                {faculty.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.faculty_id_code})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-border rounded hover:bg-ghost transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-steel text-white rounded hover:bg-steel-dark transition-colors">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

