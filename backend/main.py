from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict
import psycopg2
import json
import os
import re
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class EvaluationPayload(BaseModel):
    answers: Dict[int, str]

def get_db_connection():
    return psycopg2.connect(host="localhost", database="inthack_db", user="postgres", password="password")

@app.get("/topics")
def get_topics():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT topic FROM assessments ORDER BY topic ASC")
    topics = [row[0] for row in cur.fetchall() if row[0]]
    cur.close()
    conn.close()
    return {"topics": topics}

@app.get("/difficulties")
def get_difficulties(topic: str):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT difficulty FROM assessments WHERE topic = %s ORDER BY difficulty ASC", (topic,))
    difficulties = [row[0] for row in cur.fetchall() if row[0]]
    cur.close()
    conn.close()
    return {"difficulties": difficulties}

@app.get("/exams/questions-by-topic")
def get_questions_by_topic(topic: str, difficulty: str = None):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM assessments WHERE topic = %s AND difficulty = %s", (topic, difficulty))
    columns = [desc[0] for desc in cur.description]
    questions = [dict(zip(columns, row)) for row in cur.fetchall()]
    cur.close()
    conn.close()
    return {"questions": questions}

@app.post("/seed-database")
def seed_database():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM assessments;")
        inserted_count = 0
        base_dir = os.path.join(os.getcwd(), "CSE-Aptitude-Test-Practice-Hub")
        
        for root, _, files in os.walk(base_dir):
            for file in files:
                if file.endswith(".md"):
                    path_parts = root.split(os.sep)
                    topic = re.sub(r'^\d+\s*', '', path_parts[-2]) if len(path_parts) >= 2 else "General"
                    difficulty = re.sub(r'^\d+\s*', '', path_parts[-1]) if len(path_parts) >= 1 else "Basic"
                    
                    with open(os.path.join(root, file), 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        blocks = re.split(r'\n(?=\d+\.\s)', content)
                        
                        for block in blocks:
                            if "**Question**:" in block:
                                q_match = re.search(r'\*\*Question\*\*: (.*?)(?=\n\s*\*\*Solution\*\*|\n[a-dA-D1-4][\)\.]|\n\s*\*\*Answer\*\*)', block, re.IGNORECASE | re.DOTALL)
                                a_match = re.search(r'\*\*Answer\*\*:?\s*([a-dA-D1-4])', block, re.IGNORECASE)
                                
                                if q_match:
                                    q_text = q_match.group(1).strip()
                                    ans = a_match.group(1).strip() if a_match else "A"
                                    # Insert as empty list for text-input style
                                    cur.execute("INSERT INTO assessments (topic, difficulty, question_text, options, correct_answer) VALUES (%s, %s, %s, %s, %s)",
                                                (topic, difficulty, q_text, json.dumps([]), ans))
                                    inserted_count += 1
        conn.commit()
        cur.close()
        conn.close()
        return {"message": f"Successfully seeded {inserted_count} questions."}
    except Exception as e:
        return {"error": str(e)}

@app.post("/assessments/evaluate")
def evaluate_assessment(payload: EvaluationPayload):
    conn = get_db_connection()
    cur = conn.cursor()
    question_ids = tuple(payload.answers.keys())
    cur.execute("SELECT id, correct_answer FROM assessments WHERE id IN %s", (question_ids,))
    results = cur.fetchall()
    correct_count = sum(1 for q_id, correct_ans in results if str(payload.answers.get(q_id, "")).strip().lower() == str(correct_ans).strip().lower())
    cur.close()
    conn.close()
    return {"total": len(results), "correct": correct_count, "score_percentage": round((correct_count / len(results)) * 100, 2) if results else 0}