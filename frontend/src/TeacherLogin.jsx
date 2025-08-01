import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function TeacherLogin() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("http://127.0.0.1:5000/teacher/login", formData);

      // Store all needed info for filtering
     localStorage.setItem("teacher", JSON.stringify(res.data.teacher));
     console.log(res.data.teacher)


      setMessage("✅ Login successful!");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.error || "Login failed"));
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 shadow-lg rounded-lg bg-white">
      <h2 className="text-xl font-semibold mb-4">🔐 Teacher Login</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          onChange={handleChange}
          value={formData.email}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
          onChange={handleChange}
          value={formData.password}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        {message && <p className="text-center text-sm mt-2">{message}</p>}
      </form>
      <p className="text-center text-sm mt-4">
        Don’t have an account?{" "}
        <Link to="/teacher/register" className="text-blue-600 underline cursor-pointer">
          Register here
        </Link>
      </p>
    </div>
  );
}

export default TeacherLogin;
