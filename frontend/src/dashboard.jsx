import React, { useState, useEffect, useMemo } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import { useNavigate } from "react-router-dom";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enIN } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Search,
  CheckCircle,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Header from "./Header";

const locales = {
  "en-IN": enIN,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function Dashboard() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [teacher, setTeacher] = useState(null);
  const [classOptions, setClassOptions] = useState([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    try {
      const storedTeacher = localStorage.getItem("teacher");
      if (storedTeacher) {
        const parsed = JSON.parse(storedTeacher);
        setTeacher(parsed);
        if (parsed.class_details && Array.isArray(parsed.class_details)) {
          setClassOptions(parsed.class_details);
        }
      } else {
        const teacher = {
          email: "abc@college.com",
          departments: ["ICT", "ECE"],
          years: ["1st", "2nd", "3rd"],
          subjects: ["Math", "DSA"],
          class_details: [
            { department: "ICT", year: "2nd", subject: "DSA" },
            { department: "ICT", year: "3rd", subject: "Math" },
            { department: "ECE", year: "1st", subject: "Math" },
            { department: "ECE", year: "2nd", subject: "DSA" },
          ],
        };
        localStorage.setItem("teacher", JSON.stringify(teacher));
        setTeacher(teacher);
        setClassOptions(teacher.class_details);
      }
    } catch (err) {
      console.error("Error parsing teacher:", err);
    }
  }, []);

  const filteredClasses = useMemo(() => {
    return classOptions.filter((cls) =>
      `${cls.department} ${cls.year} ${cls.subject}`
        .toLowerCase()
        .includes(searchText.toLowerCase())
    );
  }, [searchText, classOptions]);

  const handleSelectSlot = async (slotInfo) => {
    const selectedDate = slotInfo.start;
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const selectedClass = JSON.parse(localStorage.getItem("selectedClass"));

    if (!selectedClass) {
      alert("Please confirm & save the class first.");
      return;
    }

    const queryParams = new URLSearchParams({
      date: formattedDate,
      department: selectedClass.department,
      year: selectedClass.year,
      subject: selectedClass.subject,
    });

    try {
      const response = await fetch(`http://localhost:5000/attendance/by-date?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        navigate(`/attendance/${formattedDate}`, { state: { data } });
      } else {
        alert(data.error || "Failed to fetch attendance.");
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      alert("Server error while fetching attendance.");
    }
  };

  const handleConfirm = (cls) => {
    localStorage.setItem("selectedClass", JSON.stringify(cls));
    alert("Class selected successfully. You can now go to Upload, Pending, etc.");
    window.location.reload();
  };

  const handleNavigate = (newDate) => {
    setCurrentDate(newDate);
  };

  return (
    <>
      <Header />
      <div className="h-[calc(100vh-64px)] bg-gradient-to-tr from-sky-50 via-indigo-50 to-purple-50 p-4 flex gap-4">
        {/* Calendar */}
        <div className="flex-[1.5] bg-white border shadow rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-slate-700 to-slate-800 text-white">
            <h1 className="text-2xl font-semibold flex items-center gap-3">
              <CalendarIcon size={28} />
              Academic Calendar
            </h1>
            <p className="text-slate-200 text-sm mt-1">Click a date to manage class attendance</p>
          </div>

          <div className="p-4 h-[calc(100%-88px)]">
            <BigCalendar
              localizer={localizer}
              events={[]}
              startAccessor="start"
              endAccessor="end"
              date={currentDate}
              onNavigate={handleNavigate}
              selectable
              onSelectSlot={handleSelectSlot}
              views={["month"]}
              style={{ height: "100%", width: "100%" }}
              className="rounded-xl"
            />
          </div>
        </div>

        {/* Class Search & Stats */}
        <div className="w-72 space-y-4">
          {/* Search */}
          <div className="bg-white rounded-2xl shadow border overflow-hidden">
            <div className="p-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
              <h3 className="text-md font-semibold flex items-center gap-2">
                <Search size={18} />
                Search Class
              </h3>
              <p className="text-xs text-blue-100 mt-1">e.g., ICT 2nd DSA</p>
            </div>

            <div className="p-4 space-y-3">
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="ICT 2nd Python"
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {filteredClasses.length === 0 ? (
                  <div className="text-sm text-slate-500 p-2 border border-slate-200 rounded-lg flex items-center gap-2">
                    <AlertCircle size={16} />
                    No matching class
                  </div>
                ) : (
                  filteredClasses.map((cls, i) => (
                    <div
                      key={i}
                      className="p-3 border border-blue-100 rounded-md bg-blue-50 text-blue-800"
                    >
                      <div className="font-semibold text-sm">
                        {cls.department} - {cls.year}
                      </div>
                      <div className="text-xs">{cls.subject}</div>
                      <button
                        onClick={() => handleConfirm(cls)}
                        className="mt-2 text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded flex items-center gap-1"
                      >
                        <CheckCircle size={14} />
                        Confirm
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-2xl shadow border overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
              <h3 className="text-lg font-semibold">Statistics</h3>
              <p className="text-emerald-100 text-sm">Overview of your classes</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center text-sm text-slate-700">
                <span>Departments</span>
                <span className="font-semibold">
                  {[...new Set(classOptions.map((cls) => cls.department))].length}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-700">
                <span>Subjects</span>
                <span className="font-semibold">
                  {[...new Set(classOptions.map((cls) => cls.subject))].length}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-700">
                <span>Total Classes</span>
                <span className="font-semibold">{classOptions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
