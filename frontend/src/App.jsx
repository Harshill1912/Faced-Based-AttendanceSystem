import { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import StudentRegisteration from './studentRegisteration';
import PendingApprovals from './Pending';
import UploadAttendance from './uploadAttendance';
import Dashboard from './dashboard';
import AttendanceDetail from './AttendanceDetail';
import Summary from './Summary';
import Manual from './Manual';
import StudentDetail from './StudentDetail';
import TeacherRegister from './TeacherRegistration';
import TeacherLogin from './TeacherLogin';
import TeacherProfile from './TeacherProfile';

function App() {
 

  return (
    <Router>
      <Routes>
         <Route path='/' element={<Dashboard/>}/>
        <Route path="/student-register" element={<StudentRegisteration />} />
        <Route path='/pending' element={<PendingApprovals/>}/>
        <Route path='/upload' element={<UploadAttendance/>}/>
        <Route path='attendance/:date' element={<AttendanceDetail/>}/>
        <Route path='/attendance-summary' element={<Summary/>}/>
        <Route path="/manual-entry" element={<Manual />} />
      <Route path="/attendance/student/:roll_no" element={<StudentDetail />} />
       <Route path="/teacher/register" element={<TeacherRegister/>} />
       <Route path='/teacher/login' element={<TeacherLogin/>}/>
       <Route path='/teacher/profile' element={<TeacherProfile/>}/>
      </Routes>
    </Router>
  );
}

export default App;
