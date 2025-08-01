import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "./Header";

function UploadAttendance() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const[date,setDate]=useState(()=>{
    const today=new Date();
    return today.toISOString().split('T')[0];
  })

  useEffect(() => {
    const stored = localStorage.getItem("selectedClass");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSelectedClass(parsed);
      } catch (err) {
        console.error("Invalid selectedClass in localStorage");
      }
    }
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select an image");
    if (!selectedClass) return alert("No class selected.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("department_id", selectedClass.department);
    formData.append("year", selectedClass.year);
    formData.append("subject_ids", JSON.stringify([selectedClass.subject]));
    formData.append("date",date)

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/upload", formData);
      setResult(res.data);
    } catch (err) {
      alert("❌ Error uploading image");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <div className="max-w-3xl mx-auto p-6 mt-10 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Upload Group Photo for Attendance
        </h2>

        {!selectedClass ? (
          <p className="text-center text-red-500 font-medium">
            ⚠️ Please select a class in the Dashboard before uploading attendance.
          </p>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Display selected class info (readonly) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Department</label>
                  <input
                    type="text"
                    value={selectedClass.department}
                    readOnly
                    className="w-full border p-2 rounded bg-gray-100 text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">Year</label>
                  <input
                    type="text"
                    value={selectedClass.year}
                    readOnly
                    className="w-full border p-2 rounded bg-gray-100 text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">Subject</label>
                  <input
                    type="text"
                    value={selectedClass.subject}
                    readOnly
                    className="w-full border p-2 rounded bg-gray-100 text-gray-700"
                  />
                </div>
              </div>
              <div>
  <label className="block text-sm font-medium text-gray-700">
    Attendance Date
  </label>
  <input
    type="date"
    value={date}
    onChange={(e) => setDate(e.target.value)}
    className="w-full mt-2 border p-2 rounded"
  />
</div>


              {/* Upload Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Select Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full mt-2"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
              >
                {loading ? "Uploading..." : "📤 Mark Attendance"}
              </button>
            </form>

            {/* Result Summary */}
            {result && (
              <div className="mt-10 bg-gray-50 p-6 rounded-lg border shadow">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  ✅ Attendance Summary
                </h3>
                <p className="text-sm mb-1"><strong>Marked Time:</strong> {result.timestamp}</p>
                <p className="text-sm mb-2"><strong>Present Count:</strong> {result.count}</p>
                <ul className="list-disc list-inside text-sm text-gray-700 mb-4">
                  {result.present.map((roll) => (
                    <li key={roll}>{roll}</li>
                  ))}
                </ul>
                <img
                  src={`http://localhost:5000/image?${Date.now()}`}
                  alt="Marked Attendance"
                  className="mt-4 border rounded shadow"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default UploadAttendance;
