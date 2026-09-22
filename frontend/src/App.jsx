import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Batches from './pages/Batches';
import Subjects from './pages/Subjects';
import Faculty from './pages/Faculty';
import Laboratories from './pages/Laboratories';
import TimeSlots from './pages/TimeSlots';
import AutoScheduler from './pages/AutoScheduler';
import ExamSchedule from './pages/ExamSchedule';
import FacultyWorkload from './pages/FacultyWorkload';
import LabUtilization from './pages/LabUtilization';
import Conflicts from './pages/Conflicts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/batches" element={<Batches />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/laboratories" element={<Laboratories />} />
          <Route path="/time-slots" element={<TimeSlots />} />
          <Route path="/scheduler" element={<AutoScheduler />} />
          <Route path="/schedule" element={<ExamSchedule />} />
          <Route path="/workload" element={<FacultyWorkload />} />
          <Route path="/utilization" element={<LabUtilization />} />
          <Route path="/conflicts" element={<Conflicts />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
