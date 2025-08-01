import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, UserCircle, Trash2 } from 'lucide-react';

function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [teacher, setTeacher] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [newClass, setNewClass] = useState({ department: '', year: '', subject: '' });
  const [classList, setClassList] = useState([]);

  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "Upload", path: "/upload" },
    { name: "Pending", path: "/pending" },
    { name: "Summary", path: "/attendance-summary" },
    { name: "Manual Entry", path: "/manual-entry" },
  ];

  useEffect(() => {
    const teacherData = localStorage.getItem("teacher");
    if (teacherData) {
      try {
        const parsed = JSON.parse(teacherData);
        setTeacher(parsed);
        if (Array.isArray(parsed.class_details)) {
          setClassList(parsed.class_details);
        }
      } catch (err) {
        console.error("Error parsing teacher:", err);
      }
    }

    const classData = localStorage.getItem("selectedClass");
    if (classData) {
      try {
        setSelectedClass(JSON.parse(classData));
      } catch (err) {
        console.error("Error parsing selected class:", err);
      }
    }
  }, []);

  const handleNavClick = (path) => {
    if (path !== "/") {
      const selected = localStorage.getItem("selectedClass");
      if (!selected) {
        alert("⚠️ Please select a class from the Dashboard first.");
        return;
      }
    }
    navigate(path);
  };

  const clearSelectedClass = () => {
    localStorage.removeItem("selectedClass");
    setSelectedClass(null);
    alert("✅ Selected class has been cleared.");
  };

  const handleAddClass = () => {
    if (!newClass.department || !newClass.year || !newClass.subject) return;
    const updatedList = [...classList, newClass];
    const updatedTeacher = { ...teacher, class_details: updatedList };
    setClassList(updatedList);
    setTeacher(updatedTeacher);
    localStorage.setItem("teacher", JSON.stringify(updatedTeacher));
    setNewClass({ department: '', year: '', subject: '' });
  };

  const handleDeleteClass = (index) => {
    const updatedList = classList.filter((_, i) => i !== index);
    const updatedTeacher = { ...teacher, class_details: updatedList };
    setClassList(updatedList);
    setTeacher(updatedTeacher);
    localStorage.setItem("teacher", JSON.stringify(updatedTeacher));
  };

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => handleNavClick("/")} className="text-xl font-bold text-blue-600">
            🧠 Face Attendance
          </button>
          <nav className="hidden md:flex items-center space-x-4 flex-grow justify-center">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`text-sm font-medium px-3 py-2 rounded-md transition ${
                  pathname === item.path ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            {selectedClass && (
              <span className="text-sm text-gray-600 hidden md:block">
                🎯 {selectedClass.department} - {selectedClass.year} - {selectedClass.subject}
              </span>
            )}
            {teacher && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <UserCircle size={22} className="text-gray-700" />
                <span className="text-sm font-medium">{teacher.name}</span>
              </button>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white border-t shadow-sm">
            <div className="px-4 py-2 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    handleNavClick(item.path);
                    setIsMenuOpen(false);
                  }}
                  className={`block text-sm font-medium px-3 py-2 rounded-md transition ${
                    pathname === item.path ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

        {showModal && teacher && (
  <div className="absolute inset-0 flex justify-center items-start z-50 bg-black/30 p-4 overflow-y-auto">
    <div className="bg-white rounded-xl p-6 w-full max-w-xl shadow-2xl relative mt-12">
      <button
        onClick={() => setShowModal(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
      >
        <X size={22} />
      </button>
      <h2 className="text-2xl font-semibold mb-4 text-center">👤 Teacher Profile</h2>
      <div className="space-y-3 text-base text-gray-700">
        <p><strong>Name:</strong> {teacher.name}</p>
        <p><strong>Email:</strong> {teacher.email}</p>
        <p><strong>Phone:</strong> {teacher.phone}</p>
       
        <p><strong>College:</strong> {teacher.school}</p>

        {/* Class List */}
        <div className="mt-4">
          <h3 className="font-semibold text-sm text-gray-600 mb-2">📚 Added Classes</h3>
          {teacher.class_details?.length > 0 ? (
            teacher.class_details.map((cls, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-md px-3 py-2 mb-2">
                <span className="text-sm text-gray-700">{cls.department} - {cls.year} - {cls.subject}</span>
                <button
                  onClick={() => {
                    const updated = {
                      ...teacher,
                      class_details: teacher.class_details.filter((_, i) => i !== idx),
                    };
                    localStorage.setItem("teacher", JSON.stringify(updated));
                    setTeacher(updated);
                  }}
                  className="text-red-500 text-xs hover:underline"
                >
                  Delete
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No classes added.</p>
          )}
        </div>

        {/* Add New Class Form */}
        <div className="mt-4 border-t pt-4">
          <h3 className="font-semibold text-sm text-gray-600 mb-2">➕ Add New Class</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              const department = form.department.value.trim();
              const year = form.year.value.trim();
              const subject = form.subject.value.trim();

              if (!department || !year || !subject) {
                alert("Please fill all fields.");
                return;
              }

              const updated = {
                ...teacher,
                class_details: [
                  ...(teacher.class_details || []),
                  { department, year, subject },
                ],
              };
              localStorage.setItem("teacher", JSON.stringify(updated));
              setTeacher(updated);
              form.reset();
            }}
            className="space-y-2"
          >
            <input
              name="department"
              placeholder="Department"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <input
              name="year"
              placeholder="Year"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <input
              name="subject"
              placeholder="Subject"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 px-4 rounded-md"
            >
              Add Class
            </button>
          </form>
        </div>

        {/* Clear Selected Class */}
        {selectedClass && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600"><strong>Selected Class:</strong></p>
            <p className="text-sm text-gray-800">
              {selectedClass.department} - {selectedClass.year} - {selectedClass.subject}
            </p>
            <button
              onClick={clearSelectedClass}
              className="mt-2 text-sm text-red-500 hover:underline"
            >
              ❌ Clear Selected Class
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
)}

    </>
  );
}

export default Header;
