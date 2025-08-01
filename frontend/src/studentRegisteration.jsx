import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

function StudentRegistration() {
  const [rollNo, setRollNo] = useState('');
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [email, setEmail] = useState('');

  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [subject, setSubject] = useState('');

  const [searchParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const dept = searchParams.get('department');
    const yr = searchParams.get('year');
    const subj = searchParams.get('subject');

    if (dept && yr && subj) {
      setDepartment(dept);
      setYear(yr);
      setSubject(subj);
    } else {
      alert('Invalid or missing class info in URL.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rollNo || !name || !photo || !email) return alert('Please fill in all fields.');

    setLoading(true);

    const formData = new FormData();
    formData.append('roll_no', rollNo);
    formData.append('name', name);
    formData.append('photo', photo);
    formData.append('email', email);
    formData.append('department', department);
    formData.append('year', year);
    formData.append('subject', subject);

    try {
      const res = await axios.post('http://localhost:5000/register', formData);
      setMessage(res.data.message || 'Registration successful!');
      setSubmitted(true);  // Hide form after submit
    } catch (error) {
      console.error(error);
      setMessage('❌ Registration failed. Possibly duplicate or server error.');
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto mt-16 p-8 rounded-2xl shadow-xl bg-white border border-gray-200">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">📋 Register Student</h2>

      <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-3 rounded mb-6 text-sm">
        Registering for: <b>{department}</b> | Year: <b>{year}</b> | Subject: <b>{subject}</b>
      </div>

      {!submitted ? (
        <>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4 mb-6 rounded-md">
            <p className="font-semibold mb-2">📸 Photo Upload Instructions:</p>
            <ul className="list-disc ml-5 text-sm space-y-1">
              <li>Upload a <b>clear front-facing photo</b> of your face.</li>
              <li>JPG or PNG format only.</li>
              <li>Use <b>good lighting</b>, avoid shadows/sunglasses.</li>
              <li>Max size: <b>2MB</b>.</li>
              <li>Ensure full face is visible.</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Roll No</label>
              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Upload Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
                className="w-full text-gray-600"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Register'}
            </button>
          </form>
        </>
      ) : (
        <div className="text-center text-green-700 text-lg font-medium bg-green-50 border border-green-400 rounded p-6">
          🎉 {message}
          <p className="text-sm text-gray-600 mt-2">You can close this page or register another student from dashboard.</p>
        </div>
      )}
    </div>
  );
}

export default StudentRegistration;
