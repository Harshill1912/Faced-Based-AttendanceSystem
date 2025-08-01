import React, { useEffect, useState } from "react";

function TeacherProfile() {
  const [teacher, setTeacher] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("teacher");
    if (stored) setTeacher(JSON.parse(stored));
  }, []);

  if (!teacher) return <div className="p-6 text-center">No teacher data found.</div>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded-lg">
      <h2 className="text-xl font-bold mb-4">👩‍🏫 Teacher Details</h2>
      <div className="space-y-2 text-sm">
        <p><strong>Name:</strong> {teacher.name}</p>
        <p><strong>Email:</strong> {teacher.email}</p>
        <p><strong>School:</strong> {teacher.school}</p>
        <p><strong>Subject:</strong> {teacher.subject}</p>
        <p><strong>Phone:</strong> {teacher.phone}</p>
      </div>
    </div>
  );
}

export default TeacherProfile;
