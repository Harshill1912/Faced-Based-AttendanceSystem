# Face-Based Attendance System 🎓📸

A smart and efficient attendance management system using facial recognition to automate the attendance process for classrooms.

## 🚀 Features

- 👨‍🏫 Teacher registration and login
- 🧑‍🎓 Student registration with photo upload
- 🧠 Face recognition for automated attendance
- 📝 Manual attendance override (mark present/absent)
- 📊 Attendance summary per student (present/absent/percentage)
- 🖼️ View if attendance was marked via photo or manually

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Python (Flask)
- **Database**: MongoDB (with PyMongo)
- **Face Recognition**: face_recognition library
- **Deployment**: Render (Flask App), GitHub

## 📂 Project Structure

face_attendance/
│
├── backend/
│ ├── app.py
│ ├── routes/
│ ├── templates/
│ ├── static/
│ ├── .env
│ └── requirements.txt
│
├── README.md
└── .gitignore

## 🧪 Setup Instructions

### 🔧 Prerequisites

- Python 3.8+
- MongoDB database (local or MongoDB Atlas)
- GitHub account

### 📦 Installation
git clone https://github.com/Harshill1912/Faced-Based-AttendanceSystem.git
cd face_attendance/backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt

🌐 Environment Variables
Create a .env file inside the backend/ folder:

MONGO_URI=your_mongodb_connection_string
SECRET_KEY=your_flask_secret_key
▶️ Run Locally

cd backend
flask run
