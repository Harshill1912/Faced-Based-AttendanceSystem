import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function TeacherRegister() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    school: "",
    phone: "",
  });

  const [classCombos, setClassCombos] = useState([{ department: "", year: "", subject: "" }]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClassChange = (index, field, value) => {
    const updated = [...classCombos];
    updated[index][field] = value;
    setClassCombos(updated);
  };

  const addClassCombo = () => {
    setClassCombos([...classCombos, { department: "", year: "", subject: "" }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const finalData = {
      ...formData,
      class_details: classCombos,
    };

    try {
      const res = await axios.post("http://127.0.0.1:5000/teacher/register", finalData);
      setMessage("✅ " + res.data.message);
      setTimeout(() => navigate("/teacher/login"), 1500);
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.error || "Something went wrong"));
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-md p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-center mb-6">👨‍🏫 Teacher Registration</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Teacher Info */}
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleChange}
            value={formData.name}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleChange}
            value={formData.email}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleChange}
            value={formData.password}
            required
          />
          <input
            type="text"
            name="school"
            placeholder="School Name"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleChange}
            value={formData.school}
            required
          />
          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleChange}
            value={formData.phone}
            required
          />

          {/* Class Details Section */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Class Details (Department - Year - Subject)
            </label>

            {classCombos.map((combo, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Dept"
                  value={combo.department}
                  onChange={(e) => handleClassChange(index, "department", e.target.value)}
                  className="w-1/3 border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                <input
                  type="text"
                  placeholder="Year"
                  value={combo.year}
                  onChange={(e) => handleClassChange(index, "year", e.target.value)}
                  className="w-1/3 border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                <input
                  type="text"
                  placeholder="Subject"
                  value={combo.subject}
                  onChange={(e) => handleClassChange(index, "subject", e.target.value)}
                  className="w-1/3 border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
            ))}

            <button
              type="button"
              onClick={addClassCombo}
              className="text-sm text-blue-600 hover:underline mt-1"
            >
              + Add another
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register"}
          </button>

          {/* Message */}
          {message && (
            <p className={`text-sm text-center mt-2 ${message.includes("✅") ? "text-green-600" : "text-red-500"}`}>
              {message}
            </p>
          )}
        </form>

        {/* Redirect */}
        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <Link to="/teacher/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default TeacherRegister;
