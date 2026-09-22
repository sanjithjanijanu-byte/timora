import { useState, useEffect } from 'react';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';

export default function TimeSlots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ label: '', start_time: '08:30', end_time: '11:30', duration_minutes: 180 });

  const load = () => {
    setLoading(true);
    api.get('/time-slots').then(setSlots).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const seedDefaults = async () => {
    await api.post('/time-slots/seed-defaults', {});
    load();
  };

  const openAdd = () => { setEditItem(null); setForm({ label: '', start_time: '08:30', end_time: '11:30', duration_minutes: 180 }); setModalOpen(true); };
  const openEdit = (row) => { setEditItem(row); setForm({ label: row.label, start_time: row.start_time, end_time: row.end_time, duration_minutes: row.duration_minutes }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...form, duration_minutes: Number(form.duration_minutes) };
    if (editItem) { await api.put(`/time-slots/${editItem.id}`, payload); } else { await api.post('/time-slots', payload); }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (row) => { if (confirm(`Delete slot "${row.label}"?`)) { await api.del(`/time-slots/${row.id}`); load(); } };

  const columns = [
    { key: 'label', label: 'Slot' },
    { key: 'start_time', label: 'Start' },
    { key: 'end_time', label: 'End' },
    { key: 'duration_minutes', label: 'Duration (min)' },
  ];

  if (loading) return <div><h1 className="text-xl font-semibold text-navy mb-6">Time Slots</h1><SkeletonLoader rows={3} cols={4} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-navy">Time Slots</h1>
        <div className="flex gap-2">
          {slots.length === 0 && (
            <button onClick={seedDefaults} className="px-4 py-2 text-sm bg-bright text-white rounded hover:opacity-90 transition-colors">Load Defaults</button>
          )}
          <button onClick={openAdd} className="px-4 py-2 text-sm bg-steel text-white rounded hover:bg-steel-dark transition-colors">Add Slot</button>
        </div>
      </div>
      <DataTable columns={columns} data={slots} onEdit={openEdit} onDelete={handleDelete} emptyMessage="No time slots. Click Load Defaults for standard slots." />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Time Slot' : 'Add Time Slot'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Label</label>
            <input type="text" required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g., Slot 1" className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy mb-1">Start Time</label>
              <input type="time" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy mb-1">End Time</label>
              <input type="time" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Duration (minutes)</label>
            <input type="number" min="30" required value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
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
