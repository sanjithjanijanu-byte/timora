import { useState, useEffect } from 'react';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Laboratories() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', lab_number: '', building: '', floor: '', capacity: 35, equipment: '', lab_type: '', is_available: true });

  const load = () => {
    setLoading(true);
    api.get('/laboratories').then(setLabs).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openAdd = () => { setEditItem(null); setForm({ name: '', lab_number: '', building: '', floor: '', capacity: 35, equipment: '', lab_type: '', is_available: true }); setModalOpen(true); };
  const openEdit = (row) => { setEditItem(row); setForm({ name: row.name, lab_number: row.lab_number || '', building: row.building || '', floor: row.floor || '', capacity: row.capacity, equipment: row.equipment || '', lab_type: row.lab_type || '', is_available: row.is_available }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...form, capacity: Number(form.capacity) };
    if (editItem) { await api.put(`/laboratories/${editItem.id}`, payload); } else { await api.post('/laboratories', payload); }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (row) => { if (confirm(`Delete lab "${row.name}"?`)) { await api.del(`/laboratories/${row.id}`); load(); } };

  const columns = [
    { key: 'name', label: 'Lab Name' },
    { key: 'lab_number', label: 'Number' },
    { key: 'building', label: 'Building' },
    { key: 'floor', label: 'Floor' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'lab_type', label: 'Type' },
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

  if (loading) return <div><h1 className="text-xl font-semibold text-navy mb-6">Laboratories</h1><SkeletonLoader /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-navy">Laboratories</h1>
        <button onClick={openAdd} className="px-4 py-2 text-sm bg-steel text-white rounded hover:bg-steel-dark transition-colors">Add Laboratory</button>
      </div>
      <DataTable columns={columns} data={labs} onEdit={openEdit} onDelete={handleDelete} emptyMessage="No laboratories added yet" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Laboratory' : 'Add Laboratory'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Lab Name</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Lab Number</label>
              <input type="text" value={form.lab_number} onChange={(e) => setForm({ ...form, lab_number: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Building</label>
              <input type="text" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Floor</label>
              <input type="text" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Capacity</label>
              <input type="number" min="1" required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Lab Type</label>
              <input type="text" value={form.lab_type} onChange={(e) => setForm({ ...form, lab_type: e.target.value })} placeholder="e.g., Computer Lab" className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Equipment</label>
              <input type="text" value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} placeholder="e.g., PCs, Routers" className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} className="rounded" />
            <label className="text-sm text-navy">Available for exams</label>
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
