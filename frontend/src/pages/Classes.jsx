import { useState, useEffect } from 'react';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editSection, setEditSection] = useState(null);
  const [form, setForm] = useState({ department_id: '', name: '', year_semester: '', total_students: 0 });
  const [secForm, setSecForm] = useState({ class_id: '', name: '', student_count: 0 });

  // Expandable section detail state
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [sectionDetail, setSectionDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/classes'), api.get('/sections'), api.get('/departments')])
      .then(([c, s, d]) => { setClasses(c); setSections(s); setDepartments(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openAdd = () => { setEditItem(null); setForm({ department_id: departments[0]?.id || '', name: '', year_semester: '', total_students: 0 }); setModalOpen(true); };
  const openEdit = (row) => { setEditItem(row); setForm({ department_id: row.department_id, name: row.name, year_semester: row.year_semester || '', total_students: row.total_students }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...form, department_id: Number(form.department_id), total_students: Number(form.total_students) };
    if (editItem) { await api.put(`/classes/${editItem.id}`, payload); } else { await api.post('/classes', payload); }
    setModalOpen(false);
    load();
  };

  const handleDelete = async (row) => { if (confirm(`Delete class "${row.name}"?`)) { await api.del(`/classes/${row.id}`); load(); } };

  const openAddSection = () => { setEditSection(null); setSecForm({ class_id: classes[0]?.id || '', name: '', student_count: 0 }); setSectionModalOpen(true); };
  const openEditSection = (row) => { setEditSection(row); setSecForm({ class_id: row.class_id, name: row.name, student_count: row.student_count }); setSectionModalOpen(true); };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    const payload = { ...secForm, class_id: Number(secForm.class_id), student_count: Number(secForm.student_count) };
    if (editSection) { await api.put(`/sections/${editSection.id}`, payload); } else { await api.post('/sections', payload); }
    setSectionModalOpen(false);
    load();
  };

  const handleDeleteSection = async (row) => { if (confirm(`Delete section "${row.name}"?`)) { await api.del(`/sections/${row.id}`); load(); } };

  // Toggle expand/collapse and fetch detail data
  const toggleSectionDetail = async (sectionId) => {
    if (expandedSectionId === sectionId) {
      setExpandedSectionId(null);
      setSectionDetail(null);
      return;
    }
    setExpandedSectionId(sectionId);
    setSectionDetail(null);
    setDetailLoading(true);
    try {
      const detail = await api.get(`/sections/${sectionId}/details`);
      setSectionDetail(detail);
    } catch (err) {
      console.error('Failed to load section details:', err);
      setSectionDetail({ subjects: [] });
    } finally {
      setDetailLoading(false);
    }
  };

  const classColumns = [
    { key: 'department_name', label: 'Department' },
    { key: 'name', label: 'Class Name' },
    { key: 'year_semester', label: 'Year/Semester' },
    { key: 'total_students', label: 'Total Students' },
  ];

  const sectionColumns = [
    { key: 'class_name', label: 'Class' },
    { key: 'name', label: 'Section' },
    { key: 'department_name', label: 'Department' },
    { key: 'student_count', label: 'Students' },
  ];

  if (loading) return <div><h1 className="text-xl font-semibold text-navy mb-6">Classes & Sections</h1><SkeletonLoader /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-navy">Classes & Sections</h1>
        <div className="flex gap-2">
          <button onClick={openAdd} className="px-4 py-2 text-sm bg-steel text-white rounded hover:bg-steel-dark transition-colors">Add Class</button>
          <button onClick={openAddSection} className="px-4 py-2 text-sm bg-bright text-white rounded hover:opacity-90 transition-colors">Add Section</button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-base font-medium text-navy mb-3">Classes</h2>
        <DataTable columns={classColumns} data={classes} onEdit={openEdit} onDelete={handleDelete} emptyMessage="No classes added yet" />
      </div>

      <div>
        <h2 className="text-base font-medium text-navy mb-3">Sections</h2>
        {sections.length === 0 ? (
          <div className="border border-border rounded-md px-4 py-8 text-center text-mid text-sm">
            No sections added yet
          </div>
        ) : (
          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ice">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase tracking-wide w-8"></th>
                  {sectionColumns.map((col) => (
                    <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase tracking-wide">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((sec, i) => (
                  <SectionRow
                    key={sec.id}
                    section={sec}
                    index={i}
                    columns={sectionColumns}
                    isExpanded={expandedSectionId === sec.id}
                    detail={expandedSectionId === sec.id ? sectionDetail : null}
                    detailLoading={expandedSectionId === sec.id && detailLoading}
                    onToggle={() => toggleSectionDetail(sec.id)}
                    onEdit={() => openEditSection(sec)}
                    onDelete={() => handleDeleteSection(sec)}
                  />
                ))}
              </tbody>
            </table>
            <p className="text-xs text-mid px-4 py-2 border-t border-border">{sections.length} record{sections.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>

      {/* Class Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Class' : 'Add Class'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Department</label>
            <select required value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel">
              <option value="">Select Department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Class Name</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Year/Semester</label>
            <input type="text" value={form.year_semester} onChange={(e) => setForm({ ...form, year_semester: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Total Students</label>
            <input type="number" min="0" value={form.total_students} onChange={(e) => setForm({ ...form, total_students: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-border rounded hover:bg-ghost transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-steel text-white rounded hover:bg-steel-dark transition-colors">Save</button>
          </div>
        </form>
      </Modal>

      {/* Section Modal */}
      <Modal isOpen={sectionModalOpen} onClose={() => setSectionModalOpen(false)} title={editSection ? 'Edit Section' : 'Add Section'}>
        <form onSubmit={handleSaveSection} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Class</label>
            <select required value={secForm.class_id} onChange={(e) => setSecForm({ ...secForm, class_id: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel">
              <option value="">Select Class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Section Name</label>
            <input type="text" required value={secForm.name} onChange={(e) => setSecForm({ ...secForm, name: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Student Count</label>
            <input type="number" min="0" required value={secForm.student_count} onChange={(e) => setSecForm({ ...secForm, student_count: e.target.value })} className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setSectionModalOpen(false)} className="px-4 py-2 text-sm border border-border rounded hover:bg-ghost transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm bg-bright text-white rounded hover:opacity-90 transition-colors">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


/** Expandable section row — shows subjects + faculty when expanded */
function SectionRow({ section, index, columns, isExpanded, detail, detailLoading, onToggle, onEdit, onDelete }) {
  const totalCols = columns.length + 2; // +1 for expand icon, +1 for actions

  return (
    <>
      <tr
        className={`border-t border-border cursor-pointer ${index % 2 === 1 ? 'bg-ghost' : 'bg-white'} hover:bg-ice transition-colors`}
        onClick={onToggle}
      >
        <td className="px-4 py-3 text-navy">
          <span className="inline-block transition-transform" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            ▸
          </span>
        </td>
        {columns.map((col) => (
          <td key={col.key} className="px-4 py-3 text-navy">
            {section[col.key]}
          </td>
        ))}
        <td className="px-4 py-3">
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onEdit}
              className="text-xs px-2 py-1 rounded bg-steel text-white hover:bg-steel-dark transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={totalCols} className="p-0">
            <div className="bg-ice border-t border-border">
              <div className="px-6 py-4">
                <h3 className="text-xs font-semibold text-navy uppercase tracking-wide mb-3">
                  Subjects & Faculty — {section.class_name} Section {section.name}
                  {detail?.department_name && <span className="font-normal normal-case text-mid ml-2">({detail.department_name})</span>}
                </h3>

                {detailLoading ? (
                  <div className="flex items-center gap-2 py-4 text-sm text-mid">
                    <span className="inline-block w-4 h-4 border-2 border-steel border-t-transparent rounded-full animate-spin"></span>
                    Loading subjects...
                  </div>
                ) : detail && detail.subjects && detail.subjects.length > 0 ? (
                  <div className="overflow-x-auto border border-border rounded bg-white">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white border-b border-border">
                          <th className="px-4 py-2 text-left text-xs font-semibold text-navy uppercase tracking-wide">Subject</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-navy uppercase tracking-wide">Code</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-navy uppercase tracking-wide">Lab Type</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-navy uppercase tracking-wide">Sessions</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-navy uppercase tracking-wide">Duration</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-navy uppercase tracking-wide">Faculty</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-navy uppercase tracking-wide">Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.subjects.map((subj, si) => {
                          const isPractical = Boolean(subj.required_lab_type);
                          return (
                            <tr key={subj.subject_id} className={`border-t border-border ${si % 2 === 1 ? 'bg-ghost' : ''}`}>
                              <td className="px-4 py-2 text-navy font-medium">{subj.subject_name}</td>
                              <td className="px-4 py-2 text-navy">{subj.subject_code}</td>
                              <td className="px-4 py-2 text-navy">{subj.required_lab_type || '—'}</td>
                              <td className="px-4 py-2 text-navy">{subj.sessions_required}</td>
                              <td className="px-4 py-2 text-navy">{subj.duration_minutes} min</td>
                              <td className="px-4 py-2 text-navy">
                                {subj.faculty_name ? (
                                  <span>{subj.faculty_name} <span className="text-mid">({subj.faculty_id_code})</span></span>
                                ) : (
                                  <span className="text-mid">Not assigned</span>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                {subj.faculty_name ? (
                                  isPractical ? (
                                    <span className="inline-block text-xs px-2 py-0.5 rounded border border-amber-400 bg-amber-50 text-amber-800 font-medium">
                                      Practical Incharge
                                    </span>
                                  ) : (
                                    <span className="inline-block text-xs px-2 py-0.5 rounded border border-steel/30 bg-steel/5 text-steel font-medium">
                                      Coordinator
                                    </span>
                                  )
                                ) : (
                                  <span className="text-mid text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-mid py-2">No subjects found for this department.</p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
