import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';

function AttendanceDetail() {
  const { date } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [presentRollNos, setPresentRollNos] = useState([]);
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const selectedClass = JSON.parse(localStorage.getItem("selectedClass"));

      if (!selectedClass) {
        alert("Class not selected. Please go back to dashboard and confirm class.");
        navigate("/");
        return;
      }

      const res = await axios.get("http://localhost:5000/attendance/by-date-detailed", {
        params: {
          date: date,
          department: selectedClass.department,
          year: selectedClass.year,
          subject: selectedClass.subject,
        },
      });

      const studentList = res.data.students || [];

      setStudents(studentList);
 
      const presentRolls = studentList
  .filter((s) => s.status.toLowerCase() === "present")
  .map((s) => s.roll_no);

// Determine if attendance was even marked
const hasAnyStatus = studentList.some(
  (s) => s.status.toLowerCase() === "present" || s.status.toLowerCase() === "absent"
);
setIsAttendanceMarked(hasAnyStatus);
     

      setPresentRollNos(presentRolls);
    
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setStudents([]);
      setPresentRollNos([]);
      setIsAttendanceMarked(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [date, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    const dateObj = new Date(dateString);
    return dateObj.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const exportToCSV = () => {
    if (students.length === 0) return;

    const headers = ['Roll No', 'Name', 'Status', 'Marked By'];
    const rows = students.map((s) => [
      s.roll_no,
      s.name,
      !isAttendanceMarked
        ? 'Not Marked'
        : presentRollNos.includes(s.roll_no)
        ? 'Present'
        : 'Absent',
      s.source === 'face' ? 'Face' : s.source === 'manual' ? 'Manual' : '-'
    ]);

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += headers.join(',') + '\n';
    rows.forEach((row) => {
      csvContent += row.join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const presentCount = presentRollNos.length;
  const totalStudents = students.length;
  const attendanceRate = totalStudents === 0 ? 0 : Math.round((presentCount / totalStudents) * 100);

  return (
    <div className="bg-[#f9f9fc] min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="bg-white p-2 rounded-full shadow hover:bg-gray-100 transition"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Attendance for {formatDate(date)}
            </h1>
          </div>
        </div>

        {/* Warning if not marked */}
        {!isAttendanceMarked && !loading && (
  <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-800 rounded-md shadow-sm flex items-start gap-2">
    <span className="text-xl">⚠️</span>
    <div>
      <p className="font-semibold">Attendance Not Marked</p>
      <p className="text-sm">
        You haven't uploaded a class photo or marked attendance manually for this date.
        Please upload the image or use manual entry to mark attendance.
      </p>
    </div>
  </div>
)}


        {/* Summary */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-5 rounded-lg shadow text-center">
            <p className="text-sm text-gray-500 mb-1">👥 Total Students</p>
            <p className="text-xl font-semibold">{totalStudents}</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow text-center">
            <p className="text-sm text-gray-500 mb-1">✔ Present</p>
            <p className="text-xl font-semibold text-green-600">{presentCount}</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow text-center">
            <p className="text-sm text-gray-500 mb-1">📊 Attendance Rate</p>
            <p className="text-xl font-semibold text-blue-600">{attendanceRate}%</p>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white p-12 rounded shadow text-center">
            <div className="flex justify-center items-center space-x-3">
              <div className="h-6 w-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Loading attendance...</span>
            </div>
          </div>
        ) : students.length > 0 ? (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-4">
              <h2 className="text-lg font-semibold">Student Attendance</h2>
              <p className="text-sm text-blue-100">All students with current status</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="text-left text-gray-700">
                    <th className="px-6 py-3 border-b">Roll No.</th>
                    <th className="px-6 py-3 border-b">Student Name</th>
                    <th className="px-6 py-3 border-b">Status</th>
                    <th className="px-6 py-3 border-b">Marked By</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {students
                    .slice()
                    .sort((a, b) => a.roll_no.localeCompare(b.roll_no))
                    .map((student) => {
                      const isPresent = presentRollNos.includes(student.roll_no);
                      return (
                        <tr key={student.roll_no} className="hover:bg-gray-50 border-b">
                          <td className="px-6 py-4 text-gray-900 font-medium">{student.roll_no}</td>
                          <td className="px-6 py-4 text-gray-700">{student.name}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                !isAttendanceMarked
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : isPresent
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-600'
                              }`}
                            >
                              {!isAttendanceMarked
                                ? '❌ Not Marked'
                                : isPresent
                                ? '✔ Present'
                                : '❌ Absent'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {student.source === "face"
                              ? "📸 Face"
                              : student.source === "manual"
                              ? "✍️ Manual"
                              : "-"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end px-6 py-4 bg-gray-50 border-t">
              <button
                onClick={exportToCSV}
                className="bg-green-600 hover:bg-green-700 text-white text-sm px-5 py-2 rounded-md transition"
              >
                📤 Export as CSV
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded shadow text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No Students Found
            </h3>
            <p className="text-gray-500 mb-4">
              No student records found in the system.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
            >
              Back to Calendar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendanceDetail;
