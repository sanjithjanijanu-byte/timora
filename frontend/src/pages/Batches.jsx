import { useState, useEffect } from 'react';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [autoModalOpen, setAutoModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ section_id: '', name: '', size: 35 });
  const [autoForm, setAutoForm] = useState({ section_id: '', max_batch_size: 35 });

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/batches'), api.get('/sections')])
      .then(([b, s]) => { setBatches(b); setSections(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openAdd = () => { setEditItem(null); setForm({ section_id: sections[0]?.id || '', name: '', size: 35 }); setModalOpen(true); };
  const openEdit = (row) => { setEditItem(row); setForm({ section_id: row.section_id, name: row.name, size: row.size }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...form, section_id: Number(form.section_id), size: Number(form.size) };
    if (editItem) { await api.put(`/batches/${editItem.id}`, payload); } else { await api.post('/batches', payload); }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (row) => { if (confirm(`Delete batch "${row.name}"?`)) { await api.del(`/batches/${row.id}`); load(); } };

  const handleAutoGenerate = async (e) => {
    e.preventDefault();
    await api.post('/batches/auto-generate', { section_id: Number(autoForm.section_id), max_batch_size: Number(autoForm.max_batch_size) });
    setAutoModalOpen(false);
    load();
  };

  const columns = [
    { key: 'class_name', label: 'Class' },
    { key: 'section_name', label: 'Section' },
    { key: 'name', label: 'Batch' },
    { key: 'size', label: 'Size' },
  ];

  if (loading) return <div><h1 className="text-xl font-semibold text-navy mb-6">Batches</h1><SkeletonLoader /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-navy">Batches</h1>
        <div className="flex gap-2">
          <button onClick={() => { setAutoForm({ section_id: sections[0]?.id || '', max_batch_size: 35 }); setAutoModalOpen(true); }} className="px-4 py-2 text-sm bg-bright text-white rounded hover:opacity-90 transition-colors">Auto Generate</button>
          <button onClick={openAdd} className="px-4 py-2 text-sm bg-steel text-white rounded hover:bg-steel-dark transition-colors">Add Batch</button>
        </div>
      </div>
      <DataTable columns={columns} data={batches} onEdit={openEdit} onDelete={handleDelete} emptyMessage="No batches. Use Auto Generate to create batches from sections." />

      {/* Manual Batch Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Batch' : 'Add Batch'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Section</label>
            <select required value={form.section_id} onChange={(e) => setForm({ ...form, section_id: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel">
              <option value="">Select Section</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.class_name} - {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Batch Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Batch Size</label>
            <input type="number" min="1" required value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-border rounded hover:bg-ghost transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-steel text-white rounded hover:bg-steel-dark transition-colors">Save</button>
          </div>
        </form>
      </Modal>

      {/* Auto Generate Modal */}
      <Modal isOpen={autoModalOpen} onClose={() => setAutoModalOpen(false)} title="Auto Generate Batches">
        <form onSubmit={handleAutoGenerate} className="space-y-4">
          <p className="text-sm text-mid">Automatically divide a section's students into batches of the specified maximum size.</p>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Section</label>
            <select required value={autoForm.section_id} onChange={(e) => setAutoForm({ ...autoForm, section_id: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel">
              <option value="">Select Section</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.class_name} - {s.name} ({s.student_count} students)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Max Batch Size</label>
            <input type="number" min="1" max="100" required value={autoForm.max_batch_size} onChange={(e) => setAutoForm({ ...autoForm, max_batch_size: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setAutoModalOpen(false)} className="px-4 py-2 text-sm border border-border rounded hover:bg-ghost transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-bright text-white rounded hover:opacity-90 transition-colors">Generate</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
