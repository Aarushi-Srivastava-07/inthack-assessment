Inthack Assessment Platform
A comprehensive, full-stack web application designed to facilitate aptitude assessments for students. It features a robust backend for handling questions and an interactive, proctored assessment interface for test-takers.

🚀 Tech Stack
Frontend: Next.js (React), Tailwind CSS

Backend: FastAPI (Python)

Database: PostgreSQL

Proctoring: Browser-based visibility tracking

📋 Features
Assessment Dashboard: Browse and filter questions by Topic and Difficulty.

Interactive Interface: Clean, user-friendly UI for answering aptitude questions.

Integrated Proctoring: Real-time monitoring of tab-switching to ensure test integrity.

Automated Seeding: Built-in utility to seed the database with Markdown-based question banks.

🛠 Setup & Installation
Prerequisites
Python 3.x

Node.js (LTS version)

PostgreSQL

Backend Setup
Navigate to the backend directory:

Bash
cd backend
Create and activate a virtual environment:

Bash
python -m venv venv
# Windows: 
venv\Scripts\activate
Install dependencies:

Bash
pip install fastapi uvicorn psycopg2-binary
Start the server:

Bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
Frontend Setup
Navigate to the frontend directory:

Bash
cd frontend
Install dependencies:

Bash
npm install
Start the development server:

Bash
npm run dev
📚 Database Management
The system includes a seeding utility. Once the backend is running, you can seed the database by sending a POST request to /seed-database.
