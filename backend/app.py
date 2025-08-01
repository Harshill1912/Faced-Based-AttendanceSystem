from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from flask_mail import Mail, Message
import os
import cv2
import numpy as np
import face_recognition
from database import (
    add_student,
    add_pending_student,
    mark_attendance,
    get_today_attendance,
    get_all_students,
    get_attendance_by_date,
    pending_col,
    teachers_col,
    attendance_col,
    students_col,
)
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import urllib.request
import json
import urllib.parse



app = Flask(__name__)
CORS(app)

app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))


# Flask-Mail Config (Gmail Example)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'hharshil1912@gmail.com'  # Your Gmail
app.config['MAIL_PASSWORD'] = 'zupe rmdg swxj zfpm'     # App password (not normal password)

mail = Mail(app)

# Folder to save student photos
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'images')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# teacher registraion
@app.route("/teacher/register", methods=["POST"])
def register_teacher():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    school = data.get("school")
    phone = data.get("phone")
    class_details = data.get("class_details", [])

    if not all([name, email, password, school, phone]) or not class_details:
        return jsonify({"error": "All fields are required"}), 400

    if teachers_col.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 400

    hashed_password = generate_password_hash(password)

    teachers_col.insert_one({
        "name": name,
        "email": email,
        "password": hashed_password,
        "school": school,
        "phone": phone,
        "class_details": class_details,
        "registered_at": datetime.now().isoformat()
    })

    return jsonify({"message": "Teacher registered successfully"}), 200

@app.route("/teacher/login", methods=["POST"])
def login_teacher():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    teacher = teachers_col.find_one({"email": email})
    if not teacher or not check_password_hash(teacher["password"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({
        "message": "Login successful",
        "teacher": {
            "name": teacher["name"],
            "email": teacher["email"],
            "school": teacher["school"],
            "phone": teacher.get("phone", ""),
            "class_details": teacher.get("class_details", [])  # 👈 important!
        }
    }), 200
 


#  Serve specific student image (e.g., /image/23.jpg)
@app.route('/image/<filename>')
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

#  View last marked attendance image
@app.route("/image", methods=["GET"])
def marked_image():
    path = os.path.join(os.path.dirname(__file__), "last_attendance.jpg")
    if not os.path.exists(path):
        return jsonify({"error": "Marked image not found"}), 404
    return send_file(path, mimetype="image/jpeg")

# 🔹 View pending students
@app.route("/pending", methods=["GET"])
def get_pending_students():
    department = request.args.get("department")
    year = request.args.get("year")
    subject = request.args.get("subject")

    query = {"status": "pending"}
    if department:
        query["department_id"] = department
    if year:
        query["year"] = year
    if subject:
        query["subject_ids"] = {"$in": [subject]}

    records = list(pending_col.find(query, {"_id": 0}))
    return jsonify(records)



# Student registration request (goes to pending)
@app.route("/register", methods=["POST"])
def register_student():
    roll_no = request.form.get("roll_no")
    name = request.form.get("name")
    email = request.form.get("email")
    file = request.files.get("photo")

    department = request.form.get("department")
    year = request.form.get("year")
    subject = request.form.get("subject")
    registration_date = datetime.now().strftime("%Y-%m-%d")


    if not roll_no or not name or not file or not email:
        return jsonify({"error": "Missing fields"}), 400

    filename = f"{roll_no}.jpg"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    # Store student with class info in pending collection
    add_pending_student(
        roll_no=roll_no,
        name=name,
        photo_path=f"images/{filename}",
        email=email,
        department_id=department,
        year=year,
        subject_ids=[subject], 
         registration_date=registration_date # store as list
    )

    #Send confirmation email
    try:
        msg = Message(
            "Registration Received - Pending Approval",
            sender=app.config['MAIL_USERNAME'],
            recipients=[email]
        )
        msg.body = f"""
Hello {name},

✅ Your registration (Roll No: {roll_no}) has been received.

Please wait while the teacher approves your request.

Thank you!
        """
        mail.send(msg)
    except Exception as e:
        print(f"[Mail Error] Confirmation: {e}")

    return jsonify({"message": "Student submitted for approval"}), 200

# Approve
@app.route("/approve", methods=["POST"])
def approve_pending_student():
    data = request.get_json()
    roll_no = data.get("roll_no")
    department = data.get("department")
    year = data.get("year")
    subject = data.get("subject")

    student = pending_col.find_one({"roll_no": roll_no, "status": "pending"})
    if not student:
        return jsonify({"error": "Pending student not found"}), 404

    add_student(
        roll_no=student["roll_no"],
        name=student["name"],
        photo_path=student["photo_path"],
        department_id=department,
        year=year,
        subject_ids=[subject]
    )

    pending_col.update_one({"roll_no": roll_no}, {"$set": {"status": "approved"}})

    try:
        msg = Message(
            "✅ Registration Approved",
            sender=app.config['MAIL_USERNAME'],
            recipients=[student["email"]]
        )
        msg.body = f"""
Hello {student['name']},

🎉 Your registration (Roll No: {roll_no}) has been approved!

Class Info:
Department: {department}
Year: {year}
Subject: {subject}

Thank you.
        """
        mail.send(msg)
    except Exception as e:
        print(f"[Mail Error]: {e}")

    return jsonify({"message": "Student approved successfully"}), 200

#reject
@app.route("/reject", methods=["POST"])
def reject_pending_student():
    data = request.get_json()
    roll_no = data.get("roll_no")
    reason = data.get("reason", "No reason provided")

    student = pending_col.find_one({"roll_no": roll_no, "status": "pending"})
    if not student:
        return jsonify({"error": "Pending student not found"}), 404

    #  Stronger delete filter
    result = pending_col.delete_one({"roll_no": roll_no, "status": "pending"})
    print(f"[ Deletion] Deleted count: {result.deleted_count}")  # Log

    try:
        msg = Message(
            "❌ Registration Rejected",
            sender=app.config['MAIL_USERNAME'],
            recipients=[student["email"]]
        )
        msg.body = f"""
Hello {student['name']},

Your registration (Roll No: {roll_no}) has been rejected.

📌 Reason: {reason}

If you believe this is a mistake, please contact your teacher.

Regards,
Face Attendance Team
        """
        mail.send(msg)
    except Exception as e:
        print(f"[Mail Error]: {e}")

    return jsonify({"message": "Student rejected and removed from pending list"}), 200

# increasing img quality using letsenhance api

def enhance_group_photo(image_np):
    api_key = 'c517dc3143ac4a959985d54481ef448a'

    # Save temporary image
    temp_path = os.path.join(os.path.dirname(__file__), "temp_upload.jpg")
    cv2.imwrite(temp_path, image_np)

    # Upload image to Let's Enhance
    upload_url = 'https://api.letsenhance.io/v1/photo'
    headers = {
        'Authorization': f'Bearer {api_key}'
    }

    boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    with open(temp_path, 'rb') as f:
        file_content = f.read()

    body = (
        f'--{boundary}\r\n'
        'Content-Disposition: form-data; name="photo"; filename="classroom.jpg"\r\n'
        'Content-Type: image/jpeg\r\n\r\n'
    ).encode() + file_content + f'\r\n--{boundary}--\r\n'.encode()

    req = urllib.request.Request(upload_url, data=body)
    req.add_header('Authorization', f'Bearer {api_key}')
    req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')

    try:
        with urllib.request.urlopen(req) as res:
            upload_response = json.loads(res.read().decode())
    except Exception as e:
        print("Upload failed:", e)
        return None

    photo_id = upload_response.get('id')
    if not photo_id:
        print("Upload failed: No photo ID returned")
        return None

    # Enhance image
    enhance_url = f'https://api.letsenhance.io/v1/photo/{photo_id}/enhance'
    enhance_data = json.dumps({
        "version": "v2.0_faces",
        "enhance": True
    }).encode()

    req2 = urllib.request.Request(enhance_url, data=enhance_data, method="POST")
    req2.add_header('Authorization', f'Bearer {api_key}')
    req2.add_header('Content-Type', 'application/json')

    try:
        with urllib.request.urlopen(req2) as res2:
            enhance_response = json.loads(res2.read().decode())
    except Exception as e:
        print("Enhancement failed:", e)
        return None

    result_url = enhance_response.get('result_url')
    if not result_url:
        print("No result URL in enhancement response.")
        return None

    # Download enhanced image
    enhanced_path = os.path.join(os.path.dirname(__file__), "enhanced_group.jpg")
    urllib.request.urlretrieve(result_url, enhanced_path)

    return cv2.imread(enhanced_path)

#  Upload group photo to mark attendance
@app.route("/upload", methods=["POST"])
def upload_attendance_photo():
    file = request.files.get("file")
    department_id = request.form.get("department_id")
    year = request.form.get("year")
    subject_ids = request.form.get("subject_ids")
    attendance_date = request.form.get("date")

    if not file or not department_id or not year or not subject_ids or not attendance_date:
        return jsonify({"error": "Missing fields"}), 400

    #  Convert subject_ids string to Python list
    import json
    subject_ids = json.loads(subject_ids)
    
    np_img = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    if img is None:
        return jsonify({"error": "Invalid image"}), 400
    enhanced_img = enhance_group_photo(img)
    if enhanced_img is not None:
      img = enhanced_img
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    #  Get students filtered by class
    students = get_all_students(department_id=department_id, year=year, subject_ids=subject_ids)

    known_encodings = []
    known_rolls = []

    for student in students:
        path = os.path.join(os.path.dirname(__file__), student["photo_path"])
        if os.path.exists(path):
            image = face_recognition.load_image_file(path)
            encs = face_recognition.face_encodings(image)
            if encs:
                known_encodings.append(encs[0])
                known_rolls.append(student["roll_no"])

    # detect + compare
    face_locations = face_recognition.face_locations(rgb_img)
    face_encodings = face_recognition.face_encodings(rgb_img, face_locations)

    present_rolls = []

    for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
        distances = face_recognition.face_distance(known_encodings, face_encoding)
        best_match_index = np.argmin(distances)

        if distances[best_match_index] < 0.45:
            roll_no = known_rolls[best_match_index]
            if roll_no not in present_rolls:
                present_rolls.append(roll_no)
                mark_attendance(roll_no, source="face",date_str=attendance_date)

            # mark in image
            cv2.rectangle(img, (left, top), (right, bottom), (0, 255, 0), 2)
            cv2.putText(img, roll_no, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

    marked_img_path = os.path.join(os.path.dirname(__file__), "last_attendance.jpg")
    cv2.imwrite(marked_img_path, img)

    return jsonify({
        "present": present_rolls,
        "count": len(present_rolls),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

#  View today's attendance
@app.route("/attendance/today", methods=["GET"])
def today_attendance():
    return jsonify(get_today_attendance())

@app.route("/attendance", methods=["GET"])
def attendance_by_date():
    date_str = request.args.get("date")  # Expected format: '2025-07-22'
    if not date_str:
        return jsonify({"error": "Date is required"}), 400

    try:
        records = get_attendance_by_date(date_str)
        return jsonify(records)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


#  View all registered students
@app.route("/students", methods=["GET"])
def all_students():
    return jsonify(get_all_students())


@app.route("/attendance/full-history/<roll_no>", methods=["GET"])
def full_attendance_history(roll_no):
    from database import attendance_col, students_col
    from datetime import datetime
    import sys
    sys.stdout.reconfigure(encoding='utf-8')

    #  Find the student
    student = students_col.find_one({"roll_no": roll_no}, {"_id": 0})
    if not student:
        return jsonify({"error": "Student not found"}), 404

    # Get and validate registration date
    registration_date = student.get("registration_date")
    if not registration_date:
        return jsonify({"error": "Student registration date missing"}), 400

    try:
        reg_date_obj = datetime.strptime(registration_date, "%Y-%m-%d").date()
    except Exception:
        return jsonify({"error": "Invalid registration date format. Expected YYYY-MM-DD"}), 400

    # Map of {date -> status}
    records = list(attendance_col.find({"roll_no": roll_no}, {"_id": 0, "date": 1, "status": 1}))
    attendance_map = {
        record["date"]: record.get("status", "absent").capitalize()
        for record in records
    }

    #  Get all attendance dates for the student's class
    class_filter = {
        "department_id": student.get("department_id"),
        "year": student.get("year"),
        "subject_ids": {"$in": student.get("subject_ids", [])}
    }
    valid_rolls = students_col.distinct("roll_no", class_filter)
    all_class_dates = attendance_col.distinct("date", {"roll_no": {"$in": valid_rolls}})
    all_class_dates = sorted(all_class_dates)

    # Filter dates on or after registration date
    filtered_dates = [
        d for d in all_class_dates
        if datetime.strptime(d, "%Y-%m-%d").date() >= reg_date_obj
    ]

    #   Build attendance response
    full_status = []
    for date in filtered_dates:
        status = attendance_map.get(date, "Absent").capitalize()
        full_status.append({
            "date": date,
            "status": "Present" if status.lower() == "present" else "Absent"
        })

    #  Step 7: Return final response
    return jsonify({
        "roll_no": roll_no,
        "name": student["name"],
        "department_id": student.get("department_id"),
        "year": student.get("year"),
        "subject_ids": student.get("subject_ids", []),
        "registration_date": registration_date,  # Optional for frontend
        "attendance": full_status
    })

     
#summary  
@app.route("/attendance/summary", methods=["GET"])
def attendance_summary():
    from database import students_col, attendance_col
    from datetime import datetime

    teacher_email = request.args.get("teacher_email")
    department = request.args.get("department")
    year = request.args.get("year")
    subject = request.args.get("subject")

    if not all([teacher_email, department, year, subject]):
        return jsonify({"error": "Missing query parameters"}), 400

    # Get students of the class
    students = list(students_col.find({
        "department_id": department,
        "year": year,
        "subject_ids": {"$in": [subject]}
    }, {"_id": 0, "roll_no": 1, "name": 1, "registration_date": 1}))

    roll_map = {s["roll_no"]: s["name"] for s in students}
    reg_date_map = {}

    for s in students:
        try:
            reg_date_map[s["roll_no"]] = datetime.strptime(s.get("registration_date", ""), "%Y-%m-%d").date()
        except:
            reg_date_map[s["roll_no"]] = None

    roll_nos = list(roll_map.keys())

    # Get all class attendance dates (all students of same class)
    class_filter = {
        "roll_no": {"$in": roll_nos}
    }
    all_class_dates = attendance_col.distinct("date", class_filter)
    all_class_dates = sorted(all_class_dates)

    # Get all attendance records for the students
    records = list(attendance_col.find(
        {"roll_no": {"$in": roll_nos}},
        {"_id": 0, "roll_no": 1, "status": 1, "date": 1}
    ))

    # Map attendance by student and date
    attendance_map = {}
    for rec in records:
        roll = rec["roll_no"]
        date = rec["date"]
        status = rec.get("status", "absent").lower()
        if roll not in attendance_map:
            attendance_map[roll] = {}
        attendance_map[roll][date] = status

    # Final Summary
    summary = []
    for roll in roll_nos:
        reg_date = reg_date_map.get(roll)
        student_attendance = attendance_map.get(roll, {})

        present = absent = total = 0

        for date_str in all_class_dates:
            try:
                date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
            except:
                continue

            if reg_date and date_obj < reg_date:
                continue

            total += 1
            status = student_attendance.get(date_str, "absent")
            if status == "present":
                present += 1
            else:
                absent += 1

        percentage = round((present / total) * 100) if total > 0 else 0

        summary.append({
            "roll_no": roll,
            "name": roll_map[roll],
            "present": present,
            "absent": absent,
            "total_days": total,
            "percentage": percentage
        })

    return jsonify(summary), 200


# manaul
@app.route("/attendance/manual", methods=["POST"])
def manual_attendance():
    data = request.get_json()
    date_str = data.get("date")
    roll_nos = data.get("roll_nos") 
    department = data.get("department")
    year = data.get("year")
    subject = data.get("subject")

    # 🔒Validate inputs
    if not (date_str and isinstance(roll_nos, list) and department and year and subject):
        return jsonify({"error": "Missing or invalid fields"}), 400

    #  Get students from DB
    matched_students = students_col.find({
        "department_id": department,
        "year": year,
        "subject_ids": {"$in": [subject]}
    }, {"_id": 0, "roll_no": 1})

    valid_rolls = [s["roll_no"] for s in matched_students]

    present_set = set(roll_nos)
    absent_rolls = [roll for roll in valid_rolls if roll not in present_set]

    #  Clear previous attendance for this date
    attendance_col.delete_many({
        "date": date_str,
        "roll_no": {"$in": valid_rolls}
    })

    #  Insert new attendance records
    now_time = datetime.now().strftime("%H:%M:%S")
    for roll in present_set:
        attendance_col.insert_one({
            "roll_no": roll,
            "date": date_str,
            "status": "present",
            "time": now_time,
            "source" : "manual"
        })

    if present_set:
     for roll in absent_rolls:
        attendance_col.insert_one({
            "roll_no": roll,
            "date": date_str,
            "status": "absent",
            "time": now_time
        })

    return jsonify({
        "message": "Manual attendance marked.",
        "present": list(present_set),
        "absent": absent_rolls
    }), 200


@app.route("/attendance/by-date", methods=["GET"])
def get_attendance_by_date():
    date = request.args.get("date")
    department = request.args.get("department")
    year = request.args.get("year")
    subject = request.args.get("subject")

    if not all([date, department, year, subject]):
        return jsonify({"error": "Missing fields"}), 400

    #  Get relevant students
    student_cursor = students_col.find({
        "department_id": department,
        "year": year,
        "subject_ids": {"$in": [subject]}
    }, {"_id": 0, "roll_no": 1, "name": 1})

    students = list(student_cursor)
    student_rolls = [s["roll_no"] for s in students]

    # Fetch their attendance for the selected date
    attendance_cursor = attendance_col.find({
        "date": date,
        "roll_no": {"$in": student_rolls}
    }, {"_id": 0, "roll_no": 1, "status": 1})

    attendance_status = {a["roll_no"]: a["status"] for a in attendance_cursor}

    return jsonify({
        "students": students,
        "attendance": attendance_status
    }), 200


@app.route('/attendance/by-date-detailed', methods=['GET'])
def get_attendance_by_date_detailed():
    date = request.args.get('date')
    department = request.args.get('department')
    year = request.args.get('year')
    subject = request.args.get('subject')

    if not date or not department or not year or not subject:
        return jsonify({"error": "Missing parameters"}), 400

    department_id = department
    subject_ids = [subject]

    all_students = get_all_students(department_id, year, subject_ids)
    attendance_records = list(attendance_col.find({"date": date}, {"_id": 0, "roll_no": 1, "status": 1, "source": 1}))

    attendance_map = {
        record["roll_no"]: {
            "status": record["status"],
            "source": record.get("source", "-")
        }
        for record in attendance_records
    }

    students_with_status = []
    for student in all_students:
        roll = student["roll_no"]
        if roll in attendance_map:
            student["status"] = attendance_map[roll]["status"]
            student["source"] = attendance_map[roll].get("source", "-")
        else:
            student["status"] = "Not Marked"
            student["source"] = "-"

        students_with_status.append(student)

    return jsonify({"students": students_with_status})



@app.route("/students/by-class", methods=["GET"])
def students_by_class():
    department = request.args.get("department")
    year = request.args.get("year")
    subject = request.args.get("subject")

    if not all([department, year, subject]):
        return jsonify({"error": "Missing query parameters"}), 400

    from database import students_col

    try:
        students = list(students_col.find({
            "department_id": department,
            "year": year,
            "subject_ids": {"$in": [subject]}
        }, {"_id": 0, "roll_no": 1, "name": 1, "photo_path": 1}))

        return jsonify({"students": students}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
  

""""
def trigger_all_teachers_low_attendance():
    try:
        teachers = list(teachers_col.find({}, {"_id": 0, "subjects": 1, "department_id": 1, "year": 1}))

        for teacher in teachers:
            department = teacher.get("department_id")
            year = teacher.get("year")
            subjects = teacher.get("subjects", [])

            for subject in subjects:
                print(f"🔄 Checking: Dept={department}, Year={year}, Subject={subject}")
                check_and_send_low_attendance_emails(department, year, subject)

        print("✅ Completed low attendance check for all teachers.")
    except Exception as e:
        print("❌ Error during attendance check:", e)


        
def check_and_send_low_attendance_emails(department, year, subject):
    # 1. Get all students
    students = list(students_col.find({
        "department_id": department,
        "year": year,
        "subject_ids": {"$in": [subject]}
    }, {"_id": 0, "roll_no": 1, "name": 1, "registration_date": 1, "email": 1}))

    roll_map = {s["roll_no"]: s["name"] for s in students}
    email_map = {s["roll_no"]: s.get("email") for s in students}
    reg_date_map = {}
    for s in students:
        try:
            reg_date_map[s["roll_no"]] = datetime.strptime(s.get("registration_date", ""), "%Y-%m-%d").date()
        except:
            reg_date_map[s["roll_no"]] = None

    roll_nos = list(roll_map.keys())

    # 2. Get all class attendance dates
    all_class_dates = sorted(attendance_col.distinct("date", {"roll_no": {"$in": roll_nos}}))

    # 3. Find first attendance date of each month
    first_dates_of_month = {}
    for date_str in all_class_dates:
        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
            ym = (date_obj.year, date_obj.month)
            if ym not in first_dates_of_month:
                first_dates_of_month[ym] = date_obj
        except:
            continue

    today = datetime.now().date()
    if today not in first_dates_of_month.values():
        print(f"⏸️ Skipping {department}-{year}-{subject} as today is not the first attendance day.")
        return

    # 4. Get attendance records
    records = list(attendance_col.find(
        {"roll_no": {"$in": roll_nos}},
        {"_id": 0, "roll_no": 1, "status": 1, "date": 1}
    ))

    attendance_map = {}
    for rec in records:
        roll = rec["roll_no"]
        date = rec["date"]
        status = rec.get("status", "absent").lower()
        if roll not in attendance_map:
            attendance_map[roll] = {}
        attendance_map[roll][date] = status

    mailed_students = []

    # 5. Calculate attendance % and send email if <75%
    for roll in roll_nos:
        reg_date = reg_date_map.get(roll)
        student_attendance = attendance_map.get(roll, {})

        present = absent = total = 0

        for date_str in all_class_dates:
            try:
                date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
            except:
                continue

            if reg_date and date_obj < reg_date:
                continue

            total += 1
            status = student_attendance.get(date_str, "absent")
            if status == "present":
                present += 1
            else:
                absent += 1

        percentage = round((present / total) * 100) if total > 0 else 0

        if percentage < 75:
            email = email_map.get(roll)
            if email:
                send_low_attendance_email(email, roll_map[roll], percentage)
                mailed_students.append({
                    "roll_no": roll,
                    "email": email,
                    "percentage": percentage
                })

    if mailed_students:
        print(f"📬 Emails sent for {department}-{year}-{subject}: {len(mailed_students)} students.")
    else:
        print(f"✅ No students below 75% in {department}-{year}-{subject}.")



def send_low_attendance_email(to_email, name, percentage):
    sender_email = "hharshil1912@gmail.com"
    sender_password = "zupe rmdg swxj zfpm"  # Use App Password if using Gmail

    subject = "Low Attendance Warning"
    body = f"""
"""""
    Dear {name},

    This is to inform you that your current attendance is {percentage}%,
    which is below the required 75% threshold.

    Please ensure regular attendance in future classes.

    Regards,
    College Admin
    """
"""""
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, to_email, msg.as_string())
        print(f"✅ Email sent to {name} ({to_email})")
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {e}")
"""
# 🔹 Root route
@app.route("/")
def home():
    return "🎯 Face Attendance Backend Running"

# 🔹 Run server
if __name__ == "__main__":
    app.run(debug=True)

