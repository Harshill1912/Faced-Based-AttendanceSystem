import React, { useEffect, useState } from "react";
import Header from './Header'
function PendingApproval() {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [rejectingStudent, setRejectingStudent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

const fetchPending = async () => {
  const selectedClass = JSON.parse(localStorage.getItem("selectedClass"));
  if (!selectedClass) {
    alert("No class selected.");
    return;
  }

  try {
    const queryParams = new URLSearchParams(selectedClass).toString();
    const res = await fetch(`http://localhost:5000/pending?${queryParams}`);
    const data = await res.json();
    console.log("📌 Refreshed pending students:", data);
    setPendingStudents(data);
  } catch (err) {
    console.error("Fetch Error:", err);
    alert("Failed to fetch pending students.");
  }
};


  const approveStudent = async (student) => {
    const selectedClass = JSON.parse(localStorage.getItem("selectedClass"));
    const payload = {
      roll_no: student.roll_no,
      department: selectedClass.department,
      year: selectedClass.year,
      subject: selectedClass.subject,
    };

    try {
      const res = await fetch("http://localhost:5000/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`✅ ${student.name} approved`);
        fetchPending();
      } else {
        alert(data.error || "Approval failed");
      }
    } catch (err) {
      console.error("Approve Error:", err);
      alert("Failed to approve student.");
    }
  };

  const rejectStudent = async () => {
    if (!rejectionReason.trim()) {
      alert("Please enter a reason for rejection.");
      return;
    }

    const payload = {
      roll_no: rejectingStudent.roll_no,
      reason: rejectionReason,
    };

    try {
      const res = await fetch("http://localhost:5000/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`❌ ${rejectingStudent.name} rejected`);
        fetchPending();
        setRejectingStudent(null);
        setRejectionReason("");
      } else {
        alert(data.error || "Rejection failed");
      }
    } catch (err) {
      console.error("Reject Error:", err);
      alert("Failed to reject student.");
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <div>
      <Header/>
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Pending Student Approvals</h1>
      {pendingStudents.length === 0 ? (
        <p className="text-gray-600">No pending students found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingStudents.map((student) => (
            <div
              key={student.roll_no}
              className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
            >
              <img
                src={`http://localhost:5000/image/${student.photo_path.split("/").pop()}`}
                alt={`${student.name}'s photo`}
                className="w-full h-48 object-cover rounded-md mb-3"
              />

              <h2 className="text-xl font-semibold">{student.name}</h2>
              <p className="text-sm text-gray-700">📌 Roll No: {student.roll_no}</p>
              <p className="text-sm text-gray-700">📧 Email: {student.email}</p>
              <p className="text-sm text-gray-700">🏫 Department: {student.department_id}</p>
              <p className="text-sm text-gray-700">📅 Year: {student.year}</p>
              <p className="text-sm text-gray-700">📘 Subject: {student.subject_ids?.[0]}</p>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => approveStudent(student)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded cursor-pointer"
                >
                  Approve
                </button>

                <button
                  onClick={() => setRejectingStudent(student)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded cursor-pointer"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for rejection reason */}
      {rejectingStudent && (
  <div className="fixed top-0 left-0 w-full h-full bg-black/20 flex items-start justify-center pt-20 z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
      <h2 className="text-xl font-bold mb-2">Reject {rejectingStudent.name}</h2>
      <textarea
        className="w-full border border-gray-300 rounded-md p-2 mb-4"
        rows={3}
        placeholder="Enter reason for rejection"
        value={rejectionReason}
        onChange={(e) => setRejectionReason(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            setRejectingStudent(null);
            setRejectionReason("");
          }}
          className="px-4 py-1 bg-gray-300 rounded hover:bg-gray-400 cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={rejectStudent}
          className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
        >
          Confirm Reject
        </button>
      </div>
    </div>
  </div>
)}

    </div>
    </div>
  );
}

export default PendingApproval;
