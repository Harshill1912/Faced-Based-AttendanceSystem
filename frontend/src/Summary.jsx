import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import { ClipboardCopy } from 'lucide-react';

function Summary() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const navigate = useNavigate();
  const location=useLocation();

  const selectedClass = JSON.parse(localStorage.getItem("selectedClass"));
  const registrationLink = selectedClass
  ? `${window.location.origin}/student-register?department=${encodeURIComponent(selectedClass.department)}&year=${selectedClass.year}&subject=${encodeURIComponent(selectedClass.subject)}`
  : '';
  const teacher = JSON.parse(localStorage.getItem("teacher"));

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);

      try {
        if (!teacher?.email || !selectedClass) {
          alert("Missing teacher or selected class info.");
          return;
        }

        const { department, year, subject } = selectedClass;
        const res = await axios.get(`http://localhost:5000/attendance/summary`, {
          params: {
            teacher_email: teacher.email,
            department,
            year,
            subject,
          },
        });

        setSummary(res.data);
      } catch (error) {
        console.error("Failed to fetch summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  },[]);

  const handleCopyLink = () => {
  navigator.clipboard.writeText(registrationLink)
    .then(() => setCopySuccess("✅ Link copied!"))
    .catch(() => setCopySuccess("❌ Failed to copy"));
  
  setTimeout(() => setCopySuccess(""), 2500);
};


  return (
    <div>
        <Header />
    <div className="max-w-6xl mx-auto p-6">
    
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 mt-5">
        📊 Attendance Summary Report
      </h2>
    
      {/* Copy Link Button */}
  
{registrationLink && (
  <div className="mb-4 p-4 bg-blue-50 border border-blue-300 rounded-md flex items-center justify-between">
    <span className="text-blue-800 font-medium break-all">{registrationLink}</span>
    <button
      onClick={handleCopyLink}
      className="ml-4 text-blue-700 hover:text-blue-900"
      title="Copy link"
    >
      <ClipboardCopy className="w-5 h-5" />
    </button>
  </div>
)}
{copySuccess && <p className="text-green-600 text-sm mb-3">{copySuccess}</p>}


      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : summary.length === 0 ? (
        <p className="text-center text-gray-500">No summary available.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3">Roll No</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Present</th>
                <th className="px-6 py-3">Absent</th>
                <th className="px-6 py-3">Total Days</th>
                <th className="px-6 py-3">Percentage</th>
                <th className="px-6 py-3">Progress</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s) => (
                <tr key={s.roll_no} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{s.roll_no}</td>
                  <td
                    className="px-6 py-3 cursor-pointer text-blue-600 hover:underline"
                    onClick={() => navigate(`/attendance/student/${s.roll_no}`)}
                  >
                    {s.name}
                  </td>
                  <td className="px-6 py-3 text-green-700 font-semibold">{s.present}</td>
                  <td className="px-6 py-3 text-red-600">{s.absent}</td>
                  <td className="px-6 py-3">{s.total_days}</td>
                  <td className="px-6 py-3 font-semibold">{s.percentage}%</td>
                  <td className="px-6 py-3 w-64">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${s.percentage}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </div>
  );
}

export default Summary;
