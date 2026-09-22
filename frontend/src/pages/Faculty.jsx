import { useState, useEffect } from 'react';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Faculty() {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', faculty_id_code: '', department_id: '', expertise: '', max_load: 5, is_available: true });

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/faculty'), api.get('/departments')])
      .then(([f, d]) => { setFaculty(f); setDepartments(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openAdd = () => { setEditItem(null); setForm({ name: '', faculty_id_code: '', department_id: departments[0]?.id || '', expertise: '', max_load: 5, is_available: true }); setModalOpen(true); };
  const openEdit = (row) => { setEditItem(row); setForm({ name: row.name, faculty_id_code: row.faculty_id_code, department_id: row.department_id, expertise: row.expertise || '', max_load: row.max_load, is_available: row.is_available }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...form, department_id: Number(form.department_id), max_load: Number(form.max_load) };
    if (editItem) { await api.put(`/faculty/${editItem.id}`, payload); } else { await api.post('/faculty', payload); }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (row) => { if (confirm(`Delete faculty "${row.name}"?`)) { await api.del(`/faculty/${row.id}`); load(); } };

  const columns = [
    { key: 'name', label: 'Faculty Name' },
    { key: 'faculty_id_code', label: 'ID' },
    { key: 'department_name', label: 'Department' },
    { key: 'expertise', label: 'Expertise' },
    { key: 'max_load', label: 'Max Load' },
    { key: 'current_load', label: 'Current Load' },
    {
      key: 'is_available',
      label: 'Available',
      render: (val) => (
        <span className={`inline-block px-2 py-0.5 text-xs rounded ${val ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {val ? 'Yes' : 'No'}
        </span>
      ),
    },
  ];

  if (loading) return <div><h1 className="text-xl font-semibold text-navy mb-6">Faculty</h1><SkeletonLoader /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-navy">Faculty</h1>
        <button onClick={openAdd} className="px-4 py-2 text-sm bg-steel text-white rounded hover:bg-steel-dark transition-colors">Add Faculty</button>
      </div>
      <DataTable columns={columns} data={faculty} onEdit={openEdit} onDelete={handleDelete} emptyMessage="No faculty added yet" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Faculty' : 'Add Faculty'}>
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
              <label className="block text-sm font-medium text-navy mb-1">Faculty Name</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Faculty ID</label>
              <input type="text" required value={form.faculty_id_code} onChange={(e) => setForm({ ...form, faculty_id_code: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Expertise</label>
            <input type="text" value={form.expertise} onChange={(e) => setForm({ ...form, expertise: e.target.value })} placeholder="e.g., Networking, DBMS, OS" className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Max Exam Load</label>
              <input type="number" min="1" required value={form.max_load} onChange={(e) => setForm({ ...form, max_load: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-navy cursor-pointer">
                <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} className="rounded" />
                Available for exams
              </label>
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
