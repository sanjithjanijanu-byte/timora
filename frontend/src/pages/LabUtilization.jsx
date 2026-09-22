import { useState, useEffect } from 'react';
import api from '../api/client';
import SkeletonLoader from '../components/SkeletonLoader';

export default function LabUtilization() {
  const [labs, setLabs] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('all');

  useEffect(() => {
    Promise.all([
      api.get('/laboratories'),
      api.get('/scheduler/schedules'),
      api.get('/time-slots'),
    ])
      .then(([lb, sch, ts]) => {
        setLabs(lb);
        setSchedules(sch || []);
        setTimeSlots(ts || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div><h1 className="text-xl font-semibold text-navy mb-6">Lab Utilization</h1><SkeletonLoader /></div>;

  // Count exams per lab
  const labExamCount = {};
  schedules.forEach((s) => {
    labExamCount[s.lab_id] = (labExamCount[s.lab_id] || 0) + 1;
  });

  // Unique dates in schedule
  const uniqueDates = Array.from(new Set(schedules.map((s) => s.exam_date))).sort();

  // Count unique occupied slots per lab
  const labSlots = {};
  schedules.forEach((s) => {
    const key = `${s.lab_id}-${s.exam_date}-${s.time_slot_id}`;
    if (!labSlots[s.lab_id]) labSlots[s.lab_id] = new Set();
    labSlots[s.lab_id].add(key);
  });

  // Map of (labId, date, slotId) -> schedule entry
  const occupancyMap = {};
  schedules.forEach((s) => {
    const key = `${s.lab_id}_${s.exam_date}_${s.time_slot_id}`;
    occupancyMap[key] = s;
  });

  const totalPossibleSlots = (uniqueDates.length || 1) * (timeSlots.length || 1);

  const filteredDates = selectedDate === 'all' ? uniqueDates : [selectedDate];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-navy">Laboratory Utilization & Slot Availability</h1>
          <p className="text-xs text-mid mt-0.5">Track laboratory exam capacity, utilization rates, and detailed time slot bookings.</p>
        </div>
        {uniqueDates.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-mid">Filter Date:</span>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs border border-border rounded bg-white focus:outline-none focus:border-steel"
            >
              <option value="all">All Exam Dates ({uniqueDates.length})</option>
              {uniqueDates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {labs.length === 0 ? (
        <div className="bg-white border border-border rounded-md px-5 py-12 text-center text-mid text-sm">No laboratories to display</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {labs.map((lab) => {
              const exams = labExamCount[lab.id] || 0;
              const occupiedSlots = labSlots[lab.id]?.size || 0;
              const pct = totalPossibleSlots > 0 ? Math.round((occupiedSlots / totalPossibleSlots) * 100) : 0;
              const barColor = pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : 'bg-steel';

              return (
                <div key={lab.id} className="bg-white border border-border rounded-md p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-navy">{lab.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${lab.is_available ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {lab.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-mid mb-3">
                      <p>Capacity: <span className="text-navy font-medium">{lab.capacity} students</span></p>
                      <p>Total Exams: <span className="text-navy font-medium">{exams}</span></p>
                      {lab.building && <p>Location: <span className="text-navy">{lab.building} ({lab.floor})</span></p>}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-mid mb-1">
                      <span>Overall Utilization</span>
                      <span className="font-semibold text-navy">{pct}%</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-2 rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Time Slot Availability Matrix */}
          <div className="space-y-6">
            <h2 className="text-base font-semibold text-navy">Time Slot Occupancy Matrix</h2>
            {filteredDates.length === 0 ? (
              <div className="bg-white border border-border rounded-md p-6 text-center text-sm text-mid">
                No exams scheduled yet. Generate a schedule in the Auto Scheduler to view slot occupancies.
              </div>
            ) : (
              filteredDates.map((date) => (
                <div key={date} className="bg-white border border-border rounded-md overflow-hidden">
                  <div className="bg-ice px-4 py-3 border-b border-border flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-navy">Date: {date}</h3>
                    <span className="text-xs text-mid">{timeSlots.length} Time Slots</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-ghost border-b border-border">
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-navy uppercase w-48">Laboratory</th>
                          {timeSlots.map((ts) => (
                            <th key={ts.id} className="px-4 py-2.5 text-left text-xs font-semibold text-navy uppercase">
                              {ts.label} ({ts.start_time} - {ts.end_time})
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {labs.map((lab, i) => (
                          <tr key={lab.id} className={`border-b border-border ${i % 2 === 1 ? 'bg-ghost/30' : 'bg-white'}`}>
                            <td className="px-4 py-3 font-medium text-navy">
                              {lab.name}
                              <span className="block text-xs text-mid font-normal">Cap: {lab.capacity}</span>
                            </td>
                            {timeSlots.map((ts) => {
                              const key = `${lab.id}_${date}_${ts.id}`;
                              const exam = occupancyMap[key];
                              return (
                                <td key={ts.id} className="px-4 py-3 align-top">
                                  {exam ? (
                                    <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-steel-dark">{exam.subject_name}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-blue-200 text-blue-800 text-[10px] font-medium">Occupied</span>
                                      </div>
                                      <p className="text-navy">{exam.class_name} - {exam.section_name} ({exam.batch_name})</p>
                                      <p className="text-mid mt-0.5 truncate">Coord: {exam.incharge_name}</p>
                                    </div>
                                  ) : (
                                    <div className="bg-green-50/60 border border-green-200 rounded p-2 text-xs flex items-center justify-center text-green-700 font-medium">
                                      Available
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

