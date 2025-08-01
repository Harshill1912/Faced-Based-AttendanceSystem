import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CalendarCheck } from 'lucide-react';

function StudentDetail() {
  const { roll_no } = useParams();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/attendance/full-history/${roll_no}`);
        setStudent(res.data);
        setAttendance(res.data.attendance);
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [roll_no]);

  // ✅ Attendance Summary
  const totalDays = attendance.length;
  const presentDays = attendance.filter((a) => a.status === 'Present').length;
  const absentDays = totalDays - presentDays;
  const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition"
        >
          <ArrowLeft size={18} /> Back
        </button>

        {/* Student Header */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500">
            <img
              src={`http://localhost:5000/image/${roll_no}.jpg`}
              alt={`${student?.name}'s profile`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/64x64.png?text=No+Image';
              }}
            />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {student?.name} ({student?.roll_no})
            </h2>
            <p className="text-gray-500">
              {student?.year} Year, Dept: {student?.department_id}
              <br />
              Subjects: {student?.subject_ids?.join(', ') || 'N/A'}
            </p>
          </div>
        </div>

        {/* Attendance Summary */}
        {attendance.length > 0 && (
          <div className="bg-white shadow rounded-lg p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <h3 className="text-xl font-semibold text-green-700">{presentDays}</h3>
              <p className="text-sm text-gray-500">Days Present</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-red-600">{absentDays}</h3>
              <p className="text-sm text-gray-500">Days Absent</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-600">{percentage}%</h3>
              <p className="text-sm text-gray-500">Attendance %</p>
            </div>
          </div>
        )}

        {/* Attendance Records */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading attendance data...</div>
        ) : attendance.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-lg">No attendance records found.</div>
        ) : (
          <div className="space-y-4">
            {attendance.map((record, index) => {
              const isPresent = record.status === 'Present';
              const formattedDate = new Date(record.date).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <div
                  key={index}
                  className={`flex justify-between items-center px-6 py-4 rounded-lg shadow-sm border ${
                    isPresent ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <CalendarCheck size={24} className="text-gray-500" />
                    <div>
                      <p className="text-lg font-medium text-gray-800">{formattedDate}</p>
                      <p className="text-sm text-gray-500">Recorded Attendance</p>
                    </div>
                  </div>
                  <span
                    className={`px-4 py-1 text-sm font-medium rounded-full ${
                      isPresent
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-red-100 text-red-700 border border-red-300'
                    }`}
                  >
                    {isPresent ? '✔ Present' : '❌ Absent'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDetail;
