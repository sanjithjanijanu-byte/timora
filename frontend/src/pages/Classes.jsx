import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import api from '../api/client';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';

export default function Classes({ initialTab }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Tab state: 'classes' | 'batches' | 'hierarchy'
  const tabFromUrl = searchParams.get('tab');
  const pathIsBatches = location.pathname === '/batches';
  const defaultTab = initialTab || (pathIsBatches ? 'batches' : tabFromUrl || 'classes');
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Sync tab with URL / path
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    } else if (pathIsBatches) {
      setActiveTab('batches');
    } else if (tabFromUrl && ['classes', 'batches', 'hierarchy'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [initialTab, pathIsBatches, tabFromUrl]);

  const switchTab = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  // Main data states
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [autoBatchModalOpen, setAutoBatchModalOpen] = useState(false);

  // Edit targets
  const [editClass, setEditClass] = useState(null);
  const [editSection, setEditSection] = useState(null);
  const [editBatch, setEditBatch] = useState(null);

  // Forms
  const [classForm, setClassForm] = useState({ department_id: '', name: '', year_semester: '', total_students: 0 });
  const [sectionForm, setSectionForm] = useState({ class_id: '', name: '', student_count: 0 });
  const [batchForm, setBatchForm] = useState({ section_id: '', name: '', size: 35 });
  const [autoBatchForm, setAutoBatchForm] = useState({ section_id: '', max_batch_size: 35 });

  // Expandable section detail (subjects & faculty)
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [sectionDetail, setSectionDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Batches tab filters
  const [batchClassFilter, setBatchClassFilter] = useState('');
  const [batchSectionFilter, setBatchSectionFilter] = useState('');

  // Load all academic data
  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/classes'),
      api.get('/sections'),
      api.get('/departments'),
      api.get('/batches'),
    ])
      .then(([cls, sec, dept, btc]) => {
        setClasses(cls || []);
        setSections(sec || []);
        setDepartments(dept || []);
        setBatches(btc || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  // ── Class Handlers ──────────────────────────────────────────────────────────
  const openAddClass = () => {
    setEditClass(null);
    setClassForm({
      department_id: departments[0]?.id || '',
      name: '',
      year_semester: '',
      total_students: 0,
    });
    setClassModalOpen(true);
  };

  const openEditClass = (row) => {
    setEditClass(row);
    setClassForm({
      department_id: row.department_id,
      name: row.name,
      year_semester: row.year_semester || '',
      total_students: row.total_students,
    });
    setClassModalOpen(true);
  };

  const handleSaveClass = async (e) => {
    e.preventDefault();
    const payload = {
      ...classForm,
      department_id: Number(classForm.department_id),
      total_students: Number(classForm.total_students),
    };
    if (editClass) {
      await api.put(`/classes/${editClass.id}`, payload);
    } else {
      await api.post('/classes', payload);
    }
    setClassModalOpen(false);
    loadData();
  };

  const handleDeleteClass = async (row) => {
    if (confirm(`Delete class "${row.name}" and all its sections?`)) {
      await api.del(`/classes/${row.id}`);
      loadData();
    }
  };

  // ── Section Handlers ────────────────────────────────────────────────────────
  const openAddSection = (prefillClassId = null) => {
    setEditSection(null);
    setSectionForm({
      class_id: prefillClassId || classes[0]?.id || '',
      name: '',
      student_count: 0,
    });
    setSectionModalOpen(true);
  };

  const openEditSection = (row) => {
    setEditSection(row);
    setSectionForm({
      class_id: row.class_id,
      name: row.name,
      student_count: row.student_count,
    });
    setSectionModalOpen(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    const payload = {
      ...sectionForm,
      class_id: Number(sectionForm.class_id),
      student_count: Number(sectionForm.student_count),
    };
    if (editSection) {
      await api.put(`/sections/${editSection.id}`, payload);
    } else {
      await api.post('/sections', payload);
    }
    setSectionModalOpen(false);
    loadData();
  };

  const handleDeleteSection = async (row) => {
    if (confirm(`Delete section "${row.name}"?`)) {
      await api.del(`/sections/${row.id}`);
      loadData();
    }
  };

  // ── Batch Handlers ──────────────────────────────────────────────────────────
  const openAddBatch = (prefillSectionId = null) => {
    setEditBatch(null);
    setBatchForm({
      section_id: prefillSectionId || sections[0]?.id || '',
      name: '',
      size: 35,
    });
    setBatchModalOpen(true);
  };

  const openEditBatch = (row) => {
    setEditBatch(row);
    setBatchForm({
      section_id: row.section_id,
      name: row.name,
      size: row.size,
    });
    setBatchModalOpen(true);
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    const payload = {
      ...batchForm,
      section_id: Number(batchForm.section_id),
      size: Number(batchForm.size),
    };
    if (editBatch) {
      await api.put(`/batches/${editBatch.id}`, payload);
    } else {
      await api.post('/batches', payload);
    }
    setBatchModalOpen(false);
    loadData();
  };

  const handleDeleteBatch = async (row) => {
    if (confirm(`Delete batch "${row.name}"?`)) {
      await api.del(`/batches/${row.id}`);
      loadData();
    }
  };

  const openAutoBatch = (prefillSectionId = null) => {
    setAutoBatchForm({
      section_id: prefillSectionId || sections[0]?.id || '',
      max_batch_size: 35,
    });
    setAutoBatchModalOpen(true);
  };

  const handleAutoGenerateBatches = async (e) => {
    e.preventDefault();
    await api.post('/batches/auto-generate', {
      section_id: Number(autoBatchForm.section_id),
      max_batch_size: Number(autoBatchForm.max_batch_size),
    });
    setAutoBatchModalOpen(false);
    loadData();
  };

  // ── Section Detail Toggle ───────────────────────────────────────────────────
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

  // Group helpers
  const totalStudentsEnrolled = sections.reduce((sum, s) => sum + (s.student_count || 0), 0);

  // Batches filtered
  let filteredBatches = batches;
  if (batchClassFilter) {
    const classSecIds = sections.filter((s) => s.class_id === Number(batchClassFilter)).map((s) => s.id);
    filteredBatches = filteredBatches.filter((b) => classSecIds.includes(b.section_id));
  }
  if (batchSectionFilter) {
    filteredBatches = filteredBatches.filter((b) => b.section_id === Number(batchSectionFilter));
  }

  // Columns for Classes Table
  const classColumns = [
    { key: 'department_name', label: 'Department' },
    { key: 'name', label: 'Class Name' },
    { key: 'year_semester', label: 'Year/Semester' },
    {
      key: 'total_students',
      label: 'Students',
      render: (val, row) => {
        const secSum = sections.filter((s) => s.class_id === row.id).reduce((acc, s) => acc + (s.student_count || 0), 0);
        return <span>{val || secSum}</span>;
      },
    },
    {
      key: 'sections_count',
      label: 'Sections',
      render: (_, row) => {
        const count = sections.filter((s) => s.class_id === row.id).length;
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-steel border border-blue-200">
            {count} section{count !== 1 ? 's' : ''}
          </span>
        );
      },
    },
  ];

  // Columns for Batches Table
  const batchColumns = [
    { key: 'class_name', label: 'Class' },
    { key: 'section_name', label: 'Section' },
    { key: 'name', label: 'Batch' },
    {
      key: 'size',
      label: 'Size',
      render: (val) => <span className="font-medium text-navy">{val} students</span>,
    },
  ];

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-navy mb-6">Classes & Batches</h1>
        <SkeletonLoader rows={5} cols={5} />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-navy">Classes & Batches</h1>
          <p className="text-xs text-mid mt-0.5">
            Manage academic classes, sections, and practical student examination batches in one flexible workspace.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openAddClass}
            className="px-3.5 py-1.5 text-xs bg-steel text-white font-medium rounded hover:bg-steel-dark transition-colors shadow-sm"
          >
            + Add Class
          </button>
          <button
            onClick={() => openAddSection()}
            className="px-3.5 py-1.5 text-xs bg-bright text-white font-medium rounded hover:opacity-90 transition-colors shadow-sm"
          >
            + Add Section
          </button>
          <button
            onClick={() => openAddBatch()}
            className="px-3.5 py-1.5 text-xs bg-white border border-border text-navy font-medium rounded hover:bg-ghost transition-colors"
          >
            + Add Batch
          </button>
          <button
            onClick={() => openAutoBatch()}
            className="px-3.5 py-1.5 text-xs bg-emerald-600 text-white font-medium rounded hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1"
          >
            <span>⚡</span> Auto Generate Batches
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-border rounded-md p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-mid uppercase font-semibold tracking-wider">Classes</p>
            <p className="text-2xl font-bold text-navy mt-1">{classes.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-steel">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-border rounded-md p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-mid uppercase font-semibold tracking-wider">Sections</p>
            <p className="text-2xl font-bold text-navy mt-1">{sections.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-bright">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-border rounded-md p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-mid uppercase font-semibold tracking-wider">Batches</p>
            <p className="text-2xl font-bold text-navy mt-1">{batches.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white border border-border rounded-md p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-mid uppercase font-semibold tracking-wider">Total Students</p>
            <p className="text-2xl font-bold text-navy mt-1">{totalStudentsEnrolled}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => switchTab('classes')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'classes'
              ? 'border-steel text-steel bg-blue-50/50'
              : 'border-transparent text-mid hover:text-navy hover:border-gray-300'
          }`}
        >
          <span>🎓 Classes & Sections</span>
          <span className="text-xs bg-gray-200 text-gray-700 rounded-full px-2 py-0.5">
            {classes.length} / {sections.length}
          </span>
        </button>

        <button
          onClick={() => switchTab('batches')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'batches'
              ? 'border-steel text-steel bg-blue-50/50'
              : 'border-transparent text-mid hover:text-navy hover:border-gray-300'
          }`}
        >
          <span>👥 Batches Management</span>
          <span className="text-xs bg-emerald-100 text-emerald-800 rounded-full px-2 py-0.5 font-semibold">
            {batches.length}
          </span>
        </button>

        <button
          onClick={() => switchTab('hierarchy')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'hierarchy'
              ? 'border-steel text-steel bg-blue-50/50'
              : 'border-transparent text-mid hover:text-navy hover:border-gray-300'
          }`}
        >
          <span>🌳 Structure Hierarchy</span>
        </button>
      </div>

      {/* ── TAB 1: Classes & Sections View ──────────────────────────────────────── */}
      {activeTab === 'classes' && (
        <div className="space-y-8">
          {/* Classes Table */}
          <div className="bg-white border border-border rounded-md p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-navy">Academic Classes</h2>
                <p className="text-xs text-mid">List of degree courses and semesters</p>
              </div>
              <button
                onClick={openAddClass}
                className="px-3 py-1.5 text-xs bg-steel text-white font-medium rounded hover:bg-steel-dark transition-colors"
              >
                + Add Class
              </button>
            </div>
            <DataTable
              columns={classColumns}
              data={classes}
              onEdit={openEditClass}
              onDelete={handleDeleteClass}
              emptyMessage="No classes added yet"
            />
          </div>

          {/* Sections Table (with attached Batches & quick actions) */}
          <div className="bg-white border border-border rounded-md p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-navy">Class Sections & Assigned Batches</h2>
                <p className="text-xs text-mid">Click any section row to view subjects & faculty. Add or auto-generate lab batches per section.</p>
              </div>
              <button
                onClick={() => openAddSection()}
                className="px-3 py-1.5 text-xs bg-bright text-white font-medium rounded hover:opacity-90 transition-colors"
              >
                + Add Section
              </button>
            </div>

            {sections.length === 0 ? (
              <div className="border border-border rounded-md px-4 py-8 text-center text-mid text-sm bg-ghost">
                No sections added yet. Click &quot;Add Section&quot; to create one.
              </div>
            ) : (
              <div className="border border-border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ice">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase tracking-wide w-8"></th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase tracking-wide">Class</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase tracking-wide">Section</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase tracking-wide">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase tracking-wide">Students</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase tracking-wide">Batches</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-navy uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map((sec, i) => {
                      const secBatches = batches.filter((b) => b.section_id === sec.id);
                      return (
                        <UnifiedSectionRow
                          key={sec.id}
                          section={sec}
                          index={i}
                          batches={secBatches}
                          isExpanded={expandedSectionId === sec.id}
                          detail={expandedSectionId === sec.id ? sectionDetail : null}
                          detailLoading={expandedSectionId === sec.id && detailLoading}
                          onToggle={() => toggleSectionDetail(sec.id)}
                          onEdit={() => openEditSection(sec)}
                          onDelete={() => handleDeleteSection(sec)}
                          onAddBatch={() => openAddBatch(sec.id)}
                          onAutoBatch={() => openAutoBatch(sec.id)}
                        />
                      );
                    })}
                  </tbody>
                </table>
                <p className="text-xs text-mid px-4 py-2 border-t border-border bg-ghost">
                  {sections.length} record{sections.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: Batches Management View ──────────────────────────────────────── */}
      {activeTab === 'batches' && (
        <div className="bg-white border border-border rounded-md p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-semibold text-navy">Practical Examination Batches</h2>
              <p className="text-xs text-mid">Manage laboratory student batches divided per section</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAutoBatch()}
                className="px-3 py-1.5 text-xs bg-emerald-600 text-white font-medium rounded hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1"
              >
                <span>⚡</span> Auto Generate
              </button>
              <button
                onClick={() => openAddBatch()}
                className="px-3 py-1.5 text-xs bg-steel text-white font-medium rounded hover:bg-steel-dark transition-colors shadow-sm"
              >
                + Add Batch
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-ghost rounded-md border border-border mb-4">
            <span className="text-xs font-semibold text-navy uppercase tracking-wider">Filter:</span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-mid">Class:</label>
              <select
                value={batchClassFilter}
                onChange={(e) => {
                  setBatchClassFilter(e.target.value);
                  setBatchSectionFilter('');
                }}
                className="text-xs border border-border rounded px-2 py-1 bg-white focus:outline-none focus:border-steel"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-mid">Section:</label>
              <select
                value={batchSectionFilter}
                onChange={(e) => setBatchSectionFilter(e.target.value)}
                className="text-xs border border-border rounded px-2 py-1 bg-white focus:outline-none focus:border-steel"
              >
                <option value="">All Sections</option>
                {sections
                  .filter((s) => !batchClassFilter || s.class_id === Number(batchClassFilter))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.class_name} - {s.name}
                    </option>
                  ))}
              </select>
            </div>

            {(batchClassFilter || batchSectionFilter) && (
              <button
                onClick={() => {
                  setBatchClassFilter('');
                  setBatchSectionFilter('');
                }}
                className="text-xs text-red-600 hover:underline font-medium ml-auto"
              >
                Clear Filters
              </button>
            )}
          </div>

          <DataTable
            columns={batchColumns}
            data={filteredBatches}
            onEdit={openEditBatch}
            onDelete={handleDeleteBatch}
            emptyMessage="No batches found. Use Auto Generate to create batches from section sizes."
          />
        </div>
      )}

      {/* ── TAB 3: Hierarchy Tree / Overview View ───────────────────────────────── */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-6">
          <div className="bg-white border border-border rounded-md p-4">
            <h2 className="text-base font-semibold text-navy">Academic Hierarchy Overview</h2>
            <p className="text-xs text-mid mt-0.5">
              Visualize how classes branch into sections and lab batches across departments.
            </p>
          </div>

          {classes.length === 0 ? (
            <div className="bg-white border border-border rounded-md p-8 text-center text-mid text-sm">
              No classes created yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {classes.map((cls) => {
                const classSecs = sections.filter((s) => s.class_id === cls.id);
                const classTotalStudents = classSecs.reduce((acc, s) => acc + (s.student_count || 0), 0);
                const classTotalBatches = batches.filter((b) => classSecs.some((s) => s.id === b.section_id)).length;

                return (
                  <div key={cls.id} className="bg-white border border-border rounded-md overflow-hidden shadow-sm">
                    {/* Class Card Header */}
                    <div className="bg-ice/70 px-5 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-navy">{cls.name}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-100 text-steel border border-blue-200">
                          {cls.department_name || 'Department'}
                        </span>
                        {cls.year_semester && (
                          <span className="text-xs text-mid">({cls.year_semester})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-navy font-medium">
                        <span>{classSecs.length} Sections</span>
                        <span>•</span>
                        <span>{classTotalBatches} Batches</span>
                        <span>•</span>
                        <span>{classTotalStudents} Students</span>
                        <button
                          onClick={() => openAddSection(cls.id)}
                          className="ml-2 px-2.5 py-1 text-xs bg-steel text-white rounded hover:bg-steel-dark transition-colors"
                        >
                          + Add Section
                        </button>
                      </div>
                    </div>

                    {/* Sections & Batches Grid */}
                    <div className="p-5">
                      {classSecs.length === 0 ? (
                        <p className="text-xs text-mid italic">No sections configured for this class yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {classSecs.map((sec) => {
                            const secBatches = batches.filter((b) => b.section_id === sec.id);
                            return (
                              <div
                                key={sec.id}
                                className="border border-border rounded-md p-4 bg-ghost/50 flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-sm text-navy">Section {sec.name}</h4>
                                    <span className="text-xs px-2 py-0.5 bg-white border border-border rounded font-medium text-navy">
                                      {sec.student_count} students
                                    </span>
                                  </div>

                                  <div className="mb-3">
                                    <p className="text-[11px] font-semibold text-mid uppercase tracking-wide mb-1.5">
                                      Lab Batches ({secBatches.length}):
                                    </p>
                                    {secBatches.length === 0 ? (
                                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                        ⚠️ No batches generated
                                      </p>
                                    ) : (
                                      <div className="flex flex-wrap gap-1.5">
                                        {secBatches.map((b) => (
                                          <span
                                            key={b.id}
                                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-medium"
                                          >
                                            <strong>{b.name}</strong> ({b.size})
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-border flex items-center justify-between">
                                  <button
                                    onClick={() => openAutoBatch(sec.id)}
                                    className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-0.5"
                                  >
                                    <span>⚡</span> Auto-Batch
                                  </button>
                                  <button
                                    onClick={() => openAddBatch(sec.id)}
                                    className="text-xs text-steel hover:underline font-medium"
                                  >
                                    + Add Batch
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODALS ──────────────────────────────────────────────────────────────── */}

      {/* Class Modal */}
      <Modal isOpen={classModalOpen} onClose={() => setClassModalOpen(false)} title={editClass ? 'Edit Class' : 'Add Class'}>
        <form onSubmit={handleSaveClass} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Department</label>
            <select
              required
              value={classForm.department_id}
              onChange={(e) => setClassForm({ ...classForm, department_id: e.target.value })}
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
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Class Name</label>
            <input
              type="text"
              required
              placeholder="e.g. BCA Gen AI, B.Sc CS"
              value={classForm.name}
              onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Year / Semester</label>
            <input
              type="text"
              placeholder="e.g. Year 1 / Sem 1"
              value={classForm.year_semester}
              onChange={(e) => setClassForm({ ...classForm, year_semester: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Total Estimated Students</label>
            <input
              type="number"
              min="0"
              value={classForm.total_students}
              onChange={(e) => setClassForm({ ...classForm, total_students: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setClassModalOpen(false)}
              className="px-4 py-2 text-sm border border-border rounded hover:bg-ghost transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-steel text-white rounded hover:bg-steel-dark transition-colors"
            >
              Save Class
            </button>
          </div>
        </form>
      </Modal>

      {/* Section Modal */}
      <Modal isOpen={sectionModalOpen} onClose={() => setSectionModalOpen(false)} title={editSection ? 'Edit Section' : 'Add Section'}>
        <form onSubmit={handleSaveSection} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Parent Class</label>
            <select
              required
              value={sectionForm.class_id}
              onChange={(e) => setSectionForm({ ...sectionForm, class_id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel bg-white"
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Section Name</label>
            <input
              type="text"
              required
              placeholder="e.g. A, B, C"
              value={sectionForm.name}
              onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Student Count</label>
            <input
              type="number"
              min="0"
              required
              value={sectionForm.student_count}
              onChange={(e) => setSectionForm({ ...sectionForm, student_count: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSectionModalOpen(false)}
              className="px-4 py-2 text-sm border border-border rounded hover:bg-ghost transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-bright text-white rounded hover:opacity-90 transition-colors"
            >
              Save Section
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Batch Modal */}
      <Modal isOpen={batchModalOpen} onClose={() => setBatchModalOpen(false)} title={editBatch ? 'Edit Batch' : 'Add Batch'}>
        <form onSubmit={handleSaveBatch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Section</label>
            <select
              required
              value={batchForm.section_id}
              onChange={(e) => setBatchForm({ ...batchForm, section_id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel bg-white"
            >
              <option value="">Select Section</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.class_name} - {s.name} ({s.student_count} students)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Batch Name</label>
            <input
              type="text"
              required
              placeholder="e.g. B1, B2"
              value={batchForm.name}
              onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Batch Student Count / Capacity</label>
            <input
              type="number"
              min="1"
              required
              value={batchForm.size}
              onChange={(e) => setBatchForm({ ...batchForm, size: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setBatchModalOpen(false)}
              className="px-4 py-2 text-sm border border-border rounded hover:bg-ghost transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-steel text-white rounded hover:bg-steel-dark transition-colors"
            >
              Save Batch
            </button>
          </div>
        </form>
      </Modal>

      {/* Auto Generate Batches Modal */}
      <Modal
        isOpen={autoBatchModalOpen}
        onClose={() => setAutoBatchModalOpen(false)}
        title="Auto Generate Batches from Section"
      >
        <form onSubmit={handleAutoGenerateBatches} className="space-y-4">
          <p className="text-xs text-mid leading-relaxed">
            Automatically divide a section&apos;s enrolled students into balanced examination batches (e.g. B1, B2) based on your laboratory capacity or max batch size.
          </p>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Select Section</label>
            <select
              required
              value={autoBatchForm.section_id}
              onChange={(e) => setAutoBatchForm({ ...autoBatchForm, section_id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel bg-white"
            >
              <option value="">Select Section</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.class_name} - Section {s.name} ({s.student_count} students)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Max Batch Size (Students per Batch)</label>
            <input
              type="number"
              min="1"
              required
              value={autoBatchForm.max_batch_size}
              onChange={(e) => setAutoBatchForm({ ...autoBatchForm, max_batch_size: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-steel"
            />
            <p className="text-[11px] text-mid mt-1">Default is 35 (standard lab capacity).</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAutoBatchModalOpen(false)}
              className="px-4 py-2 text-sm border border-border rounded hover:bg-ghost transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium"
            >
              Generate Batches Now
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/** Expandable section row with embedded batch pills and quick batch action buttons */
function UnifiedSectionRow({
  section,
  index,
  batches,
  isExpanded,
  detail,
  detailLoading,
  onToggle,
  onEdit,
  onDelete,
  onAddBatch,
  onAutoBatch,
}) {
  return (
    <>
      <tr
        className={`border-t border-border cursor-pointer ${
          index % 2 === 1 ? 'bg-ghost' : 'bg-white'
        } hover:bg-ice transition-colors`}
        onClick={onToggle}
      >
        <td className="px-4 py-3 text-navy">
          <span
            className="inline-block transition-transform text-xs"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            ▸
          </span>
        </td>
        <td className="px-4 py-3 font-medium text-navy">{section.class_name}</td>
        <td className="px-4 py-3 font-semibold text-navy">Section {section.name}</td>
        <td className="px-4 py-3 text-mid">{section.department_name || '—'}</td>
        <td className="px-4 py-3 text-navy">{section.student_count}</td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-wrap items-center gap-1.5">
            {batches.length === 0 ? (
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                No batches
              </span>
            ) : (
              batches.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center text-xs px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-medium"
                >
                  {b.name} ({b.size})
                </span>
              ))
            )}
            <button
              onClick={onAutoBatch}
              title="Auto Generate Batches for this Section"
              className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors ml-1"
            >
              ⚡ Auto
            </button>
            <button
              onClick={onAddBatch}
              title="Add Batch to this Section"
              className="text-[11px] px-1.5 py-0.5 rounded border border-border text-navy hover:bg-ghost transition-colors"
            >
              +
            </button>
          </div>
        </td>
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-2">
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

      {/* Expanded Subjects & Faculty Sub-table */}
      {isExpanded && (
        <tr>
          <td colSpan={7} className="p-0">
            <div className="bg-ice/70 border-t border-border px-6 py-4">
              <h3 className="text-xs font-semibold text-navy uppercase tracking-wide mb-3">
                Subjects & Faculty Assignment — {section.class_name} Section {section.name}
                {detail?.department_name && (
                  <span className="font-normal normal-case text-mid ml-2">({detail.department_name})</span>
                )}
              </h3>

              {detailLoading ? (
                <div className="flex items-center gap-2 py-4 text-sm text-mid">
                  <span className="inline-block w-4 h-4 border-2 border-steel border-t-transparent rounded-full animate-spin"></span>
                  Loading subjects and faculty...
                </div>
              ) : detail && detail.subjects && detail.subjects.length > 0 ? (
                <div className="overflow-x-auto border border-border rounded bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white border-b border-border">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-navy uppercase tracking-wide">
                          Subject
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-navy uppercase tracking-wide">
                          Code
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-navy uppercase tracking-wide">
                          Lab Type
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-navy uppercase tracking-wide">
                          Sessions
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-navy uppercase tracking-wide">
                          Duration
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-navy uppercase tracking-wide">
                          Faculty
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-navy uppercase tracking-wide">
                          Role
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.subjects.map((subj, si) => {
                        const isPractical = Boolean(subj.required_lab_type);
                        return (
                          <tr
                            key={subj.subject_id}
                            className={`border-t border-border ${si % 2 === 1 ? 'bg-ghost' : ''}`}
                          >
                            <td className="px-4 py-2 text-navy font-medium">{subj.subject_name}</td>
                            <td className="px-4 py-2 text-navy">{subj.subject_code}</td>
                            <td className="px-4 py-2 text-navy">{subj.required_lab_type || '—'}</td>
                            <td className="px-4 py-2 text-navy">{subj.sessions_required}</td>
                            <td className="px-4 py-2 text-navy">{subj.duration_minutes} min</td>
                            <td className="px-4 py-2 text-navy">
                              {subj.faculty_name ? (
                                <span>
                                  {subj.faculty_name}{' '}
                                  <span className="text-mid">({subj.faculty_id_code})</span>
                                </span>
                              ) : (
                                <span className="text-mid italic">Not assigned</span>
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
          </td>
        </tr>
      )}
    </>
  );
}
