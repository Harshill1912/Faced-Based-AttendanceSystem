import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "./Header";

function ManualAttendance() {
  const [students, setStudents] = useState([]);
  const [markedAttendance, setMarkedAttendance] = useState({});
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const selectedClass = JSON.parse(localStorage.getItem("selectedClass"));
    if (!selectedClass) {
      alert("Please select a class first.");
      return;
    }

    const fetchStudents = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/attendance/by-date", {
          params: {
            date,
            department: selectedClass.department,
            year: selectedClass.year,
            subject: selectedClass.subject,
          },
        });

        const fetchedStudents = res.data.students || [];
        const fetchedAttendance = res.data.attendance || {};

        setStudents(fetchedStudents);

        const initialAttendance = {};
        let hasAnyMarked = false;

        fetchedStudents.forEach((stu) => {
          const status = fetchedAttendance[stu.roll_no];
          if (status) hasAnyMarked = true;
          initialAttendance[stu.roll_no] = status === "present";
        });

        setMarkedAttendance(initialAttendance);
        setIsAttendanceMarked(hasAnyMarked);
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [date]);

  const toggleAttendance = (rollNo) => {
    setMarkedAttendance((prev) => ({
      ...prev,
      [rollNo]: !prev[rollNo],
    }));
  };

  const handleSubmit = async () => {
    const selectedClass = JSON.parse(localStorage.getItem("selectedClass"));
    if (!selectedClass) return alert("No class selected.");

    const presentRolls = Object.entries(markedAttendance)
      .filter(([_, isPresent]) => isPresent)
      .map(([rollNo]) => rollNo);

    setIsSubmitting(true);

    try {
      const res = await axios.post("http://localhost:5000/attendance/manual", {
        date,
        roll_nos: presentRolls,
        department: selectedClass.department,
        year: selectedClass.year,
        subject: selectedClass.subject,
      });

      alert(res.data.message || "Attendance marked.");
      setIsAttendanceMarked(true); // Since we just marked it
    } catch (err) {
      console.error("Error submitting attendance:", err);
      alert("Failed to mark attendance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-6 sm:p-10">
          <h2 className="text-3xl font-semibold text-gray-800 mb-6 border-b pb-2">
            📋 Manual Attendance
          </h2>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {!isAttendanceMarked && !loading && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-md shadow-sm flex items-start gap-2">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-semibold">Attendance Not Marked</p>
                <p className="text-sm">
                  You haven't uploaded a class photo or marked attendance manually for this date.
                  Please mark attendance before leaving.
                </p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-md">
            <table className="w-full border border-gray-200 text-left text-sm">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="p-3">Roll No</th>
                  <th className="p-3">Name</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((stu, idx) => (
                  <tr key={stu.roll_no} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="p-3 font-medium text-gray-800">{stu.roll_no}</td>
                    <td className="p-3">{stu.name}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleAttendance(stu.roll_no)}
                        className={`px-4 py-1 rounded-full text-white text-sm font-semibold transition-all duration-200 ${
                          markedAttendance[stu.roll_no]
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-red-500 hover:bg-red-600"
                        }`}
                      >
                        {markedAttendance[stu.roll_no] ? "Present" : "Absent"}
                      </button>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-gray-500 italic">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`mt-6 w-full py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
              isSubmitting
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManualAttendance;
