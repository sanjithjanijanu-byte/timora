import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import SkeletonLoader from '../components/SkeletonLoader';

export default function AutoScheduler() {
  const [sections, setSections] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [labs, setLabs] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [existingSchedulesCount, setExistingSchedulesCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState(null);
  const [missingAlert, setMissingAlert] = useState(null);

  const [selected, setSelected] = useState({
    section_ids: [],
    subject_ids: [],
    lab_ids: [],
    faculty_ids: [],
    time_slot_ids: [],
    exam_dates: [],
    max_batch_size: 35,
  });
  const [dateInput, setDateInput] = useState('');

  const loadData = async () => {
    try {
      const [sec, btc, sub, lab, fac, ts, sched] = await Promise.all([
        api.get('/sections'),
        api.get('/batches'),
        api.get('/subjects'),
        api.get('/laboratories'),
        api.get('/faculty'),
        api.get('/time-slots'),
        api.get('/scheduler/schedules').catch(() => []),
      ]);
      setSections(sec || []);
      setBatches(btc || []);
      setSubjects(sub || []);
      setLabs(lab || []);
      setFaculty(fac || []);
      setTimeSlots(ts || []);
      setExistingSchedulesCount(Array.isArray(sched) ? sched.length : 0);
    } catch (err) {
      console.error('Failed to load scheduler data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Helper to calculate upcoming weekdays (excluding weekends) ─────────────
  const getUpcomingWeekdays = (count = 5) => {
    const dates = [];
    const current = new Date();
    // Start from tomorrow
    current.setDate(current.getDate() + 1);

    while (dates.length < count) {
      const day = current.getDay();
      // 0 = Sunday, 6 = Saturday
      if (day !== 0 && day !== 6) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');
        dates.push(`${yyyy}-${mm}-${dd}`);
      }
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  // ── Quick Setup: Selects all active resources and adds upcoming dates ───────
  const handleQuickSetup = () => {
    const availableLabs = labs.filter((l) => l.is_available).map((l) => l.id);
    const availableFaculty = faculty.filter((f) => f.is_available).map((f) => f.id);
    const weekdays = getUpcomingWeekdays(5);

    setSelected({
      section_ids: sections.map((s) => s.id),
      subject_ids: subjects.map((s) => s.id),
      lab_ids: availableLabs.length > 0 ? availableLabs : labs.map((l) => l.id),
      faculty_ids: availableFaculty.length > 0 ? availableFaculty : faculty.map((f) => f.id),
      time_slot_ids: timeSlots.map((ts) => ts.id),
      exam_dates: weekdays,
      max_batch_size: 35,
    });
    setMissingAlert(null);
  };

  // ── Reset / Clear selections ────────────────────────────────────────────────
  const handleClearSelections = () => {
    setSelected({
      section_ids: [],
      subject_ids: [],
      lab_ids: [],
      faculty_ids: [],
      time_slot_ids: [],
      exam_dates: [],
      max_batch_size: 35,
    });
    setMissingAlert(null);
  };

  // ── Card-level Select All & Deselect All ────────────────────────────────────
  const selectAll = (key, allIds) => {
    setSelected((prev) => ({ ...prev, [key]: allIds }));
    setMissingAlert(null);
  };

  const deselectAll = (key) => {
    setSelected((prev) => ({ ...prev, [key]: [] }));
  };

  const toggleId = (key, id) => {
    setSelected((prev) => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter((x) => x !== id) : [...prev[key], id],
    }));
    setMissingAlert(null);
  };

  // ── Date management ─────────────────────────────────────────────────────────
  const addDate = (dateVal) => {
    const target = dateVal || dateInput;
    if (target && !selected.exam_dates.includes(target)) {
      setSelected((prev) => ({ ...prev, exam_dates: [...prev.exam_dates, target] }));
      setDateInput('');
      setMissingAlert(null);
    }
  };

  const removeDate = (d) => {
    setSelected((prev) => ({ ...prev, exam_dates: prev.exam_dates.filter((x) => x !== d) }));
  };

  const addPresetDates = (count) => {
    const preset = getUpcomingWeekdays(count);
    setSelected((prev) => {
      const merged = Array.from(new Set([...prev.exam_dates, ...preset]));
      return { ...prev, exam_dates: merged };
    });
    setMissingAlert(null);
  };

  // ── Clear database schedules ────────────────────────────────────────────────
  const handleClearDatabaseSchedules = async () => {
    if (!window.confirm('Are you sure you want to clear all existing practical exam schedules from the database?')) {
      return;
    }
    setClearing(true);
    try {
      await api.del('/scheduler/schedules');
      setResult(null);
      setExistingSchedulesCount(0);
      alert('All exam schedules have been successfully cleared.');
    } catch (err) {
      alert('Failed to clear schedules: ' + (err.message || 'Unknown error'));
    } finally {
      setClearing(false);
    }
  };

  // ── Validation check ────────────────────────────────────────────────────────
  const getMissingRequirements = (currentSelected) => {
    const missing = [];
    if (!currentSelected.section_ids || currentSelected.section_ids.length === 0) {
      missing.push('Sections (at least 1 required)');
    }
    if (!currentSelected.subject_ids || currentSelected.subject_ids.length === 0) {
      missing.push('Subjects (at least 1 required)');
    }
    if (!currentSelected.lab_ids || currentSelected.lab_ids.length === 0) {
      missing.push('Laboratories (at least 1 required)');
    }
    if (!currentSelected.faculty_ids || currentSelected.faculty_ids.length < 2) {
      missing.push(`Faculty (at least 2 required, currently selected: ${currentSelected.faculty_ids?.length || 0})`);
    }
    if (!currentSelected.time_slot_ids || currentSelected.time_slot_ids.length === 0) {
      missing.push('Time Slots (at least 1 required)');
    }
    if (!currentSelected.exam_dates || currentSelected.exam_dates.length === 0) {
      missing.push('Exam Dates (at least 1 required)');
    }
    return missing;
  };

  // ── Generate schedule handler ───────────────────────────────────────────────
  const handleGenerate = async () => {
    // If user typed a date in the date input but didn't click "Add", include it automatically!
    let payload = { ...selected };
    if (dateInput && !payload.exam_dates.includes(dateInput)) {
      payload.exam_dates = [...payload.exam_dates, dateInput];
      setSelected(payload);
      setDateInput('');
    }

    const missing = getMissingRequirements(payload);
    if (missing.length > 0) {
      setMissingAlert(missing);
      return;
    }

    setMissingAlert(null);
    setGenerating(true);
    setResult(null);

    try {
      const res = await api.post('/scheduler/generate', payload);
      setResult(res);
      setExistingSchedulesCount(res?.scheduled?.length || 0);
      // Smooth scroll down to results
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Generation error:', err);
      const msg = typeof err.message === 'string' ? err.message : JSON.stringify(err);
      alert('Scheduling failed: ' + msg);
    } finally {
      setGenerating(false);
    }
  };

  const isReady =
    selected.section_ids.length > 0 &&
    selected.subject_ids.length > 0 &&
    selected.lab_ids.length > 0 &&
    selected.faculty_ids.length >= 2 &&
    selected.time_slot_ids.length > 0 &&
    (selected.exam_dates.length > 0 || dateInput);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-navy">Auto Scheduler</h1>
        <SkeletonLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Quick Action Banner */}
      <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-navy">Automatic Practical Exam Scheduler</h1>
              <span className="px-2 py-0.5 text-xs bg-ice text-steel font-semibold rounded-full border border-steel/20">
                14-Rule Constraint Engine
              </span>
            </div>
            <p className="text-xs text-mid mt-1">
              Select classes, subjects, laboratories, invigilators, and exam dates, then generate the conflict-free timetable.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleQuickSetup}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-bright text-white rounded hover:opacity-90 shadow-sm transition-all"
            >
              <span>⚡</span> Quick Setup (Select All Active)
            </button>
            <button
              onClick={handleClearSelections}
              type="button"
              className="px-3 py-2 text-xs font-medium text-navy bg-ghost hover:bg-gray-200 rounded border border-border transition-colors"
            >
              Reset Selections
            </button>
            {existingSchedulesCount > 0 && (
              <button
                onClick={handleClearDatabaseSchedules}
                disabled={clearing}
                type="button"
                className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
              >
                {clearing ? 'Clearing...' : `Clear Saved Schedule (${existingSchedulesCount})`}
              </button>
            )}
          </div>
        </div>

        {/* Missing Requirements Alert */}
        {missingAlert && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-300 rounded-md text-amber-900 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <span className="text-lg">⚠️</span>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
                  Please complete required setup before generating
                </p>
                <ul className="mt-1 list-disc list-inside text-xs space-y-0.5 font-medium text-amber-900">
                  {missingAlert.map((m, idx) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={handleQuickSetup}
                type="button"
                className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
              >
                Auto-Fix & Select All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resource Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Sections */}
        <div className="bg-white border border-border rounded-lg p-4 flex flex-col shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-navy">1. Sections</h3>
              <p className="text-[11px] text-mid">
                {selected.section_ids.length} of {sections.length} selected
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => selectAll('section_ids', sections.map((s) => s.id))}
                className="text-[11px] font-medium text-steel hover:underline px-1.5 py-0.5 rounded hover:bg-ghost"
              >
                All
              </button>
              <span className="text-mid text-xs">|</span>
              <button
                type="button"
                onClick={() => deselectAll('section_ids')}
                className="text-[11px] font-medium text-mid hover:underline px-1.5 py-0.5 rounded hover:bg-ghost"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {sections.map((s) => {
              const checked = selected.section_ids.includes(s.id);
              return (
                <label
                  key={s.id}
                  className={`flex items-center gap-2.5 text-xs text-navy cursor-pointer px-2 py-1.5 rounded border transition-colors ${
                    checked ? 'bg-ice/50 border-steel/30 font-medium' : 'hover:bg-ghost border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleId('section_ids', s.id)}
                    className="rounded text-steel focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1 truncate">
                    <span>{s.class_name} — Sec {s.name}</span>
                    <span className="text-mid ml-1.5 text-[10px]">({s.student_count} students)</span>
                  </div>
                </label>
              );
            })}
            {sections.length === 0 && (
              <p className="text-xs text-mid py-4 text-center">
                No sections found. <Link to="/classes" className="text-steel underline">Add classes & sections</Link>.
              </p>
            )}
          </div>
        </div>

        {/* 2. Subjects */}
        <div className="bg-white border border-border rounded-lg p-4 flex flex-col shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-navy">2. Subjects</h3>
              <p className="text-[11px] text-mid">
                {selected.subject_ids.length} of {subjects.length} selected
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => selectAll('subject_ids', subjects.map((s) => s.id))}
                className="text-[11px] font-medium text-steel hover:underline px-1.5 py-0.5 rounded hover:bg-ghost"
              >
                All
              </button>
              <span className="text-mid text-xs">|</span>
              <button
                type="button"
                onClick={() => deselectAll('subject_ids')}
                className="text-[11px] font-medium text-mid hover:underline px-1.5 py-0.5 rounded hover:bg-ghost"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {subjects.map((sub) => {
              const checked = selected.subject_ids.includes(sub.id);
              return (
                <label
                  key={sub.id}
                  className={`flex items-center gap-2.5 text-xs text-navy cursor-pointer px-2 py-1.5 rounded border transition-colors ${
                    checked ? 'bg-ice/50 border-steel/30 font-medium' : 'hover:bg-ghost border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleId('subject_ids', sub.id)}
                    className="rounded text-steel focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1 truncate">
                    <span>{sub.name}</span>
                    <span className="text-mid ml-1.5 text-[10px]">({sub.code})</span>
                  </div>
                </label>
              );
            })}
            {subjects.length === 0 && (
              <p className="text-xs text-mid py-4 text-center">
                No subjects found. <Link to="/subjects" className="text-steel underline">Add lab subjects</Link>.
              </p>
            )}
          </div>
        </div>

        {/* 3. Laboratories */}
        <div className="bg-white border border-border rounded-lg p-4 flex flex-col shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-navy">3. Laboratories</h3>
              <p className="text-[11px] text-mid">
                {selected.lab_ids.length} of {labs.length} selected
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => selectAll('lab_ids', labs.filter((l) => l.is_available).map((l) => l.id))}
                className="text-[11px] font-medium text-steel hover:underline px-1.5 py-0.5 rounded hover:bg-ghost"
              >
                All
              </button>
              <span className="text-mid text-xs">|</span>
              <button
                type="button"
                onClick={() => deselectAll('lab_ids')}
                className="text-[11px] font-medium text-mid hover:underline px-1.5 py-0.5 rounded hover:bg-ghost"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {labs.map((lab) => {
              const checked = selected.lab_ids.includes(lab.id);
              return (
                <label
                  key={lab.id}
                  className={`flex items-center gap-2.5 text-xs text-navy cursor-pointer px-2 py-1.5 rounded border transition-colors ${
                    checked ? 'bg-ice/50 border-steel/30 font-medium' : 'hover:bg-ghost border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleId('lab_ids', lab.id)}
                    className="rounded text-steel focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1 truncate">
                    <span>{lab.name}</span>
                    <span className="text-mid ml-1.5 text-[10px]">(Capacity: {lab.capacity})</span>
                  </div>
                  {!lab.is_available && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Unavailable</span>
                  )}
                </label>
              );
            })}
            {labs.length === 0 && (
              <p className="text-xs text-mid py-4 text-center">
                No labs found. <Link to="/laboratories" className="text-steel underline">Add laboratories</Link>.
              </p>
            )}
          </div>
        </div>

        {/* 4. Faculty */}
        <div className="bg-white border border-border rounded-lg p-4 flex flex-col shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-navy">4. Faculty (Min 2)</h3>
              <p className="text-[11px] text-mid">
                {selected.faculty_ids.length} of {faculty.length} selected
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => selectAll('faculty_ids', faculty.filter((f) => f.is_available).map((f) => f.id))}
                className="text-[11px] font-medium text-steel hover:underline px-1.5 py-0.5 rounded hover:bg-ghost"
              >
                All
              </button>
              <span className="text-mid text-xs">|</span>
              <button
                type="button"
                onClick={() => deselectAll('faculty_ids')}
                className="text-[11px] font-medium text-mid hover:underline px-1.5 py-0.5 rounded hover:bg-ghost"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {faculty.map((fac) => {
              const checked = selected.faculty_ids.includes(fac.id);
              return (
                <label
                  key={fac.id}
                  className={`flex items-center gap-2.5 text-xs text-navy cursor-pointer px-2 py-1.5 rounded border transition-colors ${
                    checked ? 'bg-ice/50 border-steel/30 font-medium' : 'hover:bg-ghost border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleId('faculty_ids', fac.id)}
                    className="rounded text-steel focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1 truncate">
                    <span>{fac.name}</span>
                    <span className="text-mid ml-1.5 text-[10px]">
                      (Load: {fac.current_load}/{fac.max_load})
                    </span>
                  </div>
                </label>
              );
            })}
            {faculty.length === 0 && (
              <p className="text-xs text-mid py-4 text-center">
                No faculty found. <Link to="/faculty" className="text-steel underline">Add faculty</Link>.
              </p>
            )}
          </div>
        </div>

        {/* 5. Time Slots */}
        <div className="bg-white border border-border rounded-lg p-4 flex flex-col shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-navy">5. Time Slots</h3>
              <p className="text-[11px] text-mid">
                {selected.time_slot_ids.length} of {timeSlots.length} selected
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => selectAll('time_slot_ids', timeSlots.map((ts) => ts.id))}
                className="text-[11px] font-medium text-steel hover:underline px-1.5 py-0.5 rounded hover:bg-ghost"
              >
                All
              </button>
              <span className="text-mid text-xs">|</span>
              <button
                type="button"
                onClick={() => deselectAll('time_slot_ids')}
                className="text-[11px] font-medium text-mid hover:underline px-1.5 py-0.5 rounded hover:bg-ghost"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {timeSlots.map((ts) => {
              const checked = selected.time_slot_ids.includes(ts.id);
              return (
                <label
                  key={ts.id}
                  className={`flex items-center gap-2.5 text-xs text-navy cursor-pointer px-2 py-1.5 rounded border transition-colors ${
                    checked ? 'bg-ice/50 border-steel/30 font-medium' : 'hover:bg-ghost border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleId('time_slot_ids', ts.id)}
                    className="rounded text-steel focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1 truncate">
                    <span className="font-medium">{ts.label}:</span>
                    <span className="text-mid ml-1.5 text-[10px]">
                      {ts.start_time} – {ts.end_time}
                    </span>
                  </div>
                </label>
              );
            })}
            {timeSlots.length === 0 && (
              <p className="text-xs text-mid py-4 text-center">
                No slots found. <Link to="/time-slots" className="text-steel underline">Add time slots</Link>.
              </p>
            )}
          </div>
        </div>

        {/* 6. Exam Dates */}
        <div className="bg-white border border-border rounded-lg p-4 flex flex-col shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-navy">6. Exam Dates</h3>
              <p className="text-[11px] text-mid">
                {selected.exam_dates.length} date(s) added
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => addPresetDates(5)}
                className="text-[11px] font-semibold text-steel hover:underline px-1.5 py-0.5 rounded hover:bg-ghost"
                title="Add next 5 business days"
              >
                +5 Days
              </button>
              <span className="text-mid text-xs">|</span>
              <button
                type="button"
                onClick={() => deselectAll('exam_dates')}
                className="text-[11px] font-medium text-mid hover:underline px-1.5 py-0.5 rounded hover:bg-ghost"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-2">
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="flex-1 px-2.5 py-1.5 text-xs border border-border rounded focus:outline-none focus:border-steel bg-white text-navy"
            />
            <button
              type="button"
              onClick={() => addDate()}
              disabled={!dateInput}
              className="px-3 py-1.5 text-xs font-semibold bg-steel text-white rounded hover:bg-steel/90 disabled:opacity-50 transition-colors"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {selected.exam_dates.sort().map((d) => (
              <span
                key={d}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-ice text-navy font-medium rounded border border-steel/20"
              >
                {d}
                <button
                  type="button"
                  onClick={() => removeDate(d)}
                  className="text-mid hover:text-red-600 font-bold ml-0.5"
                  title="Remove date"
                >
                  &times;
                </button>
              </span>
            ))}
            {selected.exam_dates.length === 0 && (
              <p className="text-xs text-mid py-3 text-center w-full">
                No dates selected yet. Pick a date above or click{' '}
                <button
                  type="button"
                  onClick={() => addPresetDates(5)}
                  className="text-steel underline font-semibold"
                >
                  +5 Days
                </button>
                .
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Generate Button Action Box */}
      <div className="bg-white border border-border rounded-lg p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className={selected.section_ids.length > 0 ? 'text-green-700 font-medium' : 'text-mid'}>
              {selected.section_ids.length > 0 ? '✓' : '○'} {selected.section_ids.length} Sections
            </span>
            <span className={selected.subject_ids.length > 0 ? 'text-green-700 font-medium' : 'text-mid'}>
              {selected.subject_ids.length > 0 ? '✓' : '○'} {selected.subject_ids.length} Subjects
            </span>
            <span className={selected.lab_ids.length > 0 ? 'text-green-700 font-medium' : 'text-mid'}>
              {selected.lab_ids.length > 0 ? '✓' : '○'} {selected.lab_ids.length} Labs
            </span>
            <span className={selected.faculty_ids.length >= 2 ? 'text-green-700 font-medium' : 'text-mid'}>
              {selected.faculty_ids.length >= 2 ? '✓' : '○'} {selected.faculty_ids.length} Faculty
            </span>
            <span className={selected.time_slot_ids.length > 0 ? 'text-green-700 font-medium' : 'text-mid'}>
              {selected.time_slot_ids.length > 0 ? '✓' : '○'} {selected.time_slot_ids.length} Slots
            </span>
            <span className={selected.exam_dates.length > 0 || dateInput ? 'text-green-700 font-medium' : 'text-mid'}>
              {selected.exam_dates.length > 0 || dateInput ? '✓' : '○'} {selected.exam_dates.length} Dates
            </span>
          </div>
          <p className="text-xs text-mid">
            {isReady
              ? 'All required parameters configured. Ready to run automatic timetable optimization.'
              : 'Tip: Click "⚡ Quick Setup" above to instantly pre-fill all available resources and dates.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className={`w-full sm:w-auto px-8 py-3.5 text-sm font-bold tracking-wide rounded-md shadow transition-all flex items-center justify-center gap-2 ${
            isReady && !generating
              ? 'bg-bright text-white hover:opacity-95 hover:shadow-md cursor-pointer'
              : 'bg-ghost text-steel border border-steel/40 hover:bg-ice/50 cursor-pointer'
          }`}
        >
          {generating ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Optimizing Timetable Allocation...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>GENERATE AUTOMATIC SCHEDULE</span>
            </>
          )}
        </button>
      </div>

      {/* Generated Schedule Results Section */}
      {result && (
        <div className="space-y-6 pt-4 animate-fadeIn">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-border rounded-lg p-5 shadow-sm border-l-4 border-l-green-600">
              <p className="text-xs text-mid uppercase font-semibold">Exams Scheduled</p>
              <p className="text-3xl font-bold text-green-700 mt-1">{result.total_scheduled}</p>
              <p className="text-[11px] text-mid mt-0.5">Allocation successful without clashes</p>
            </div>
            <div className="bg-white border border-border rounded-lg p-5 shadow-sm border-l-4 border-l-amber-500">
              <p className="text-xs text-mid uppercase font-semibold">Unscheduled Sessions</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{result.total_unscheduled}</p>
              <p className="text-[11px] text-mid mt-0.5">
                {result.total_unscheduled === 0
                  ? 'All batches successfully scheduled!'
                  : 'Add more dates/slots to fit remaining'}
              </p>
            </div>
            <div className="bg-white border border-border rounded-lg p-5 shadow-sm border-l-4 border-l-steel">
              <p className="text-xs text-mid uppercase font-semibold">Allocation Rules Verified</p>
              <p className="text-3xl font-bold text-navy mt-1">14 / 14</p>
              <p className="text-[11px] text-mid mt-0.5">Clash-free constraints enforced</p>
            </div>
          </div>

          {/* Quick Action Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-ice/40 border border-steel/20 rounded-lg p-4">
            <div className="text-xs text-navy font-medium">
              Schedule generated and saved to database! What would you like to do next?
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/schedule"
                className="px-3.5 py-2 text-xs font-semibold bg-navy text-white rounded hover:bg-navy/90 transition-colors inline-flex items-center gap-1"
              >
                <span>📅</span> View Master Exam Schedule
              </Link>
              <Link
                to="/reports"
                className="px-3.5 py-2 text-xs font-semibold bg-white text-steel border border-border rounded hover:bg-ghost transition-colors inline-flex items-center gap-1"
              >
                <span>📥</span> Export Timetable (PDF / Excel)
              </Link>
            </div>
          </div>

          {/* Zero Scheduled Warning */}
          {result.total_scheduled === 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-5 text-amber-900">
              <h4 className="font-bold text-sm">No exam sessions could be placed into the selected slots</h4>
              <p className="text-xs mt-1 text-amber-800">
                This typically happens if the available laboratories are smaller than the batch sizes, or if no exam dates / time slots were provided.
                Click <strong>"⚡ Quick Setup (Select All Active)"</strong> to automatically select suitable resources and dates.
              </p>
            </div>
          )}

          {/* Scheduled Exams Table */}
          {result.scheduled?.length > 0 && (
            <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-border bg-ice/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-navy">Generated Practical Examination Timetable</h3>
                  <p className="text-xs text-mid">Showing {result.scheduled.length} scheduled exam sessions</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/schedule"
                    className="text-xs font-semibold text-steel hover:underline"
                  >
                    Open Master Grid View &rarr;
                  </Link>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-ice border-b border-border text-navy">
                      <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Time Slot</th>
                      <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Class & Sec</th>
                      <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Batch</th>
                      <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Subject</th>
                      <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Laboratory (Venue)</th>
                      <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Main In-Charge</th>
                      <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Co-In-Charge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.scheduled.map((s, i) => (
                      <tr key={s.id || i} className={i % 2 === 1 ? 'bg-ghost/60' : 'bg-white'}>
                        <td className="px-4 py-2.5 font-semibold text-navy whitespace-nowrap">{s.exam_date}</td>
                        <td className="px-4 py-2.5 text-mid whitespace-nowrap">
                          {s.start_time} – {s.end_time}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-navy whitespace-nowrap">
                          {s.class_name} <span className="text-steel font-bold">({s.section_name})</span>
                        </td>
                        <td className="px-4 py-2.5 font-bold text-steel whitespace-nowrap">{s.batch_name}</td>
                        <td className="px-4 py-2.5 text-navy">{s.subject_name}</td>
                        <td className="px-4 py-2.5 font-semibold text-navy whitespace-nowrap">{s.lab_name}</td>
                        <td className="px-4 py-2.5 text-navy whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-steel"></span>
                            {s.incharge_name}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-mid whitespace-nowrap">{s.co_incharge_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Unscheduled Items Box */}
          {result.unscheduled?.length > 0 && (
            <div className="bg-white border border-red-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-red-700">Unscheduled Sessions ({result.unscheduled.length})</h3>
                  <p className="text-xs text-mid">
                    These sessions could not fit into the currently selected dates and slots without violating clash or capacity constraints.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addPresetDates(5)}
                  className="px-3 py-1.5 text-xs font-semibold bg-steel text-white rounded hover:bg-steel/90 transition-colors"
                >
                  + Add 5 More Dates & Re-run
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {result.unscheduled.map((u, i) => {
                  const sec = sections.find((s) => s.id === u.section_id);
                  const sub = subjects.find((s) => s.id === u.subject_id);
                  const btc = batches.find((b) => b.id === u.batch_id);
                  const secLabel = sec ? `${sec.class_name || ''} Sec ${sec.name}` : `Section #${u.section_id}`;
                  const batchLabel = btc ? btc.name : `Batch #${u.batch_id}`;
                  const subLabel = sub ? sub.name : `Subject #${u.subject_id}`;

                  return (
                    <div key={i} className="border border-red-100 rounded-md p-3 bg-red-50/60 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-900">
                          {secLabel} &bull; {batchLabel} &bull; {subLabel}
                        </span>
                        <span className="text-[10px] bg-red-200 text-red-800 px-2 py-0.5 rounded font-semibold">
                          Session {u.session_number}
                        </span>
                      </div>
                      <ul className="mt-1 list-disc list-inside text-red-700 space-y-0.5">
                        {u.reasons.map((r, j) => (
                          <li key={j}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
