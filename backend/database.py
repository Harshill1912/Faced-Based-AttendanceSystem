from pymongo import MongoClient
from datetime import datetime

client = MongoClient("mongodb+srv://hharshil1912:1912005@cluster0.szsref0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["face_attendance"]

students_col = db["students"]
attendance_col = db["attendance"]
pending_col = db["pending_students"]
teachers_col = db["teachers"]

# Helper to fetch teacher context
def get_teacher_context(email):
    teacher = teachers_col.find_one({"email": email})
    if not teacher:
        return None, None, None
    return teacher.get("department_id"), teacher.get("year"), teacher.get("subjects", [])

# Add student with dept, year, subjects
def add_student(roll_no, name, photo_path, department_id=None, year=None, subject_ids=None):
    student = {
        "roll_no": roll_no,
        "name": name,
        "photo_path": photo_path,
        "department_id": department_id,
        "year": year,
        "subject_ids": subject_ids or [],
        "created_at": datetime.now()
    }
    students_col.insert_one(student)

# Mark attendance
# Mark attendance as present
def mark_attendance(roll_no,source,date_str):
    date_str = date_str or datetime.now().strftime("%Y-%m-%d")
    existing = attendance_col.find_one({"roll_no": roll_no, "date": date_str})
    if not existing:
        attendance_col.insert_one({
            "roll_no": roll_no,
            "date": date_str,
            "status": "present",
            "timestamp": datetime.now(),
            "source" : source,
        })


# Add to pending students
def add_pending_student(roll_no, name, photo_path, email, department_id=None, year=None, subject_ids=None):
    student = {
        "roll_no": roll_no,
        "name": name,
        "photo_path": photo_path,
        "email": email,
        "department_id": department_id,
        "year": year,
        "subject_ids": subject_ids or [],
        "created_at": datetime.now(),
        "status": "pending"
    }
    pending_col.insert_one(student)

    

# Get today's attendance filtered by teacher
def get_today_attendance(email):
    today = datetime.now().strftime("%Y-%m-%d")
    return get_attendance_by_date_and_teacher(today, email)

# Get all students based on teacher context
def get_all_students_by_teacher(email):
    department_id, year, subject_ids = get_teacher_context(email)
    if not department_id or not subject_ids:
        return []

    query = {
        "department_id": department_id,
        "year": year,
        "subject_ids": {"$in": subject_ids}
    }
    return list(students_col.find(query, {"_id": 0}))

# Get attendance by date and teacher
def get_attendance_by_date_and_teacher(date_str, email):
    department_id, year, subject_ids = get_teacher_context(email)
    if not department_id or not subject_ids:
        return []

    # 🔥 Only get PRESENT students
    attendance_records = list(attendance_col.find({
        "date": date_str,
        "status": "present"
    }, {"_id": 0, "roll_no": 1}))

    roll_nos = [rec["roll_no"] for rec in attendance_records]

    query = {
        "roll_no": {"$in": roll_nos},
        "department_id": department_id,
        "year": year,
        "subject_ids": {"$in": subject_ids}
    }
    students = list(students_col.find(query, {"_id": 0, "roll_no": 1, "name": 1, "photo_path": 1}))
    return students

# Get all students optionally filtered
def get_all_students(department_id=None, year=None, subject_ids=None):
    query = {}
    if department_id:
        query["department_id"] = department_id
    if year:
        query["year"] = year
    if subject_ids:
        query["subject_ids"] = {"$in": subject_ids}
    return list(students_col.find(query, {"_id": 0}))


def get_attendance_by_date(date_str, department_id=None, year=None, subject_ids=None):
    attendance_records = list(attendance_col.find({"date": date_str}, {"_id": 0, "roll_no": 1, "status": 1}))
    roll_nos = [rec["roll_no"] for rec in attendance_records]

    query = {"roll_no": {"$in": roll_nos}}
    if department_id:
        query["department_id"] = department_id
    if year:
        query["year"] = year
    if subject_ids:
        query["subject_ids"] = {"$in": subject_ids}

    students = list(students_col.find(query, {"_id": 0, "roll_no": 1, "name": 1, "photo_path": 1}))
    return students
