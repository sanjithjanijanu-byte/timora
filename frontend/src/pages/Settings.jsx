import { useState, useEffect } from 'react';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Settings() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '' });

  const load = () => {
    setLoading(true);
    api.get('/departments').then(setDepartments).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openAdd = () => { setEditItem(null); setForm({ name: '' }); setModalOpen(true); };
  const openEdit = (row) => { setEditItem(row); setForm({ name: row.name }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editItem) { await api.put(`/departments/${editItem.id}`, form); } else { await api.post('/departments', form); }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (row) => { if (confirm(`Delete department "${row.name}"? This will delete all related classes, sections, batches, subjects, and faculty.`)) { await api.del(`/departments/${row.id}`); load(); } };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Department Name' },
  ];

  if (loading) return <div><h1 className="text-xl font-semibold text-navy mb-6">Settings</h1><SkeletonLoader rows={3} cols={2} /></div>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-navy mb-6">Settings</h1>

      {/* Departments */}
      <div className="bg-white border border-border rounded-md p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-navy">Departments</h2>
          <button onClick={openAdd} className="px-4 py-2 text-sm bg-steel text-white rounded hover:bg-steel-dark transition-colors">Add Department</button>
        </div>
        <DataTable columns={columns} data={departments} onEdit={openEdit} onDelete={handleDelete} emptyMessage="No departments. Add departments to begin setting up classes and faculty." />
      </div>

      {/* System Info */}
      <div className="bg-white border border-border rounded-md p-5">
        <h2 className="text-base font-semibold text-navy mb-3">System Information</h2>
        <div className="space-y-2 text-sm text-mid">
          <p>Application: <span className="text-navy font-medium">Timora - Exam Scheduler</span></p>
          <p>Version: <span className="text-navy">1.0.0</span></p>
          <p>Backend: <span className="text-navy">FastAPI + SQLite</span></p>
          <p>Default Batch Size: <span className="text-navy">35 students</span></p>
          <p>Default Exam Duration: <span className="text-navy">3 hours</span></p>
        </div>
      </div>

      {/* Department Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Department Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ name: e.target.value })} placeholder="e.g., Computer Science" className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
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
