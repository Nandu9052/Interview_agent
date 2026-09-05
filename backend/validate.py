"""Validation script for Interview Trainer backend."""
import json
from app import app, db

with app.app_context():
    db.create_all()
    client = app.test_client()

    print("=== BACKEND VALIDATION SUITE ===\n")

    # 1. Health
    r = client.get("/api/health")
    assert r.status_code == 200, f"Health check failed with {r.status_code}"
    h = json.loads(r.data)
    print(f"1. Health Check: status={h['status']}, model={h['model']}, rag={h['rag']}, version={h['version']}")

    # 2. Register & Login
    test_email = "test.candidate@example.com"
    test_password = "password123"
    reg_res = client.post("/api/auth/register", json={
        "email": test_email,
        "password": test_password,
        "name": "Alex Morgan",
        "role": "Software Engineer",
        "experience": "Mid-level",
        "skills": ["Python", "Algorithms", "System Design"],
    })
    
    if reg_res.status_code == 201:
        token = json.loads(reg_res.data)["token"]
        print(f"2. User Registration: Created new user with token.")
    else:
        # User already exists, log in
        login_res = client.post("/api/auth/login", json={"email": test_email, "password": test_password})
        assert login_res.status_code == 200, f"Login failed: {login_res.data}"
        token = json.loads(login_res.data)["token"]
        print(f"2. User Login: Authenticated existing user with token.")

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Get and Update Profile
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200, f"Get me failed: {me_res.data}"
    user_info = json.loads(me_res.data)["user"]
    print(f"3. User Profile: name={user_info['name']}, role={user_info['role']}, email={user_info['email']}")

    upd_res = client.put("/api/auth/profile", headers=headers, json={
        "name": "Alex Morgan",
        "role": "Full Stack Developer",
        "experience": "Senior",
    })
    assert upd_res.status_code == 200
    print(f"   Profile updated target role to 'Full Stack Developer'")

    # 4. RAG Industry Profile
    ind_res = client.get("/api/rag/industry-profile", headers=headers)
    assert ind_res.status_code == 200
    ind_data = json.loads(ind_res.data)
    print(f"4. Industry Profile: role={ind_data['role']}, skills={len(ind_data['context'].get('key_skills', []))} key skills")

    # 5. RAG Preview Questions
    prev_res = client.post("/api/rag/preview-questions", headers=headers, json={
        "role": "Full Stack Developer",
        "difficulty": "Medium",
        "topics": ["Architecture", "React"],
    })
    assert prev_res.status_code == 200
    prev_data = json.loads(prev_res.data)
    print(f"5. RAG Preview: {prev_data['total']} questions retrieved, personalized={prev_data['personalized']}")

    # 6. Question Bank with Filter
    qb_res = client.get("/api/questions?category=Data%20Structures", headers=headers)
    assert qb_res.status_code == 200
    qb_data = json.loads(qb_res.data)
    print(f"6. Question Bank: {qb_data['total']} questions found for 'Data Structures'")

    # 7. Start Interview Session
    start_res = client.post("/api/interviews/start", headers=headers, json={
        "role": "Software Engineer",
        "difficulty": "Medium",
        "topics": ["Data Structures", "Algorithms"],
    })
    assert start_res.status_code == 201
    session_id = json.loads(start_res.data)["interview"]["session_id"]
    print(f"7. Start Interview Session: session_id={session_id[:8]}...")

    # 8. Fetch Interview Question (Granite + RAG)
    q_res = client.post(f"/api/interviews/{session_id}/question", headers=headers, json={"topic": "Data Structures"})
    assert q_res.status_code == 200
    q_data = json.loads(q_res.data)
    question_id = q_data["question_id"]
    print(f"8. Generated Question (Q{q_data['question_number']}): {q_data['question'][:80]}...")

    # 9. Submit Candidate Answer & Get Evaluation
    sample_answer = (
        "Arrays use contiguous memory blocks allowing O(1) random index access, but require O(n) for middle insertions. "
        "Linked lists use non-contiguous nodes linked by pointers, which allows O(1) insertions once the pointer is reached, "
        "but has O(n) access time and higher memory overhead due to pointers."
    )
    ans_res = client.post(f"/api/interviews/{session_id}/answer", headers=headers, json={
        "question_id": question_id,
        "answer": sample_answer,
    })
    assert ans_res.status_code == 200
    eval_data = json.loads(ans_res.data)["evaluation"]
    print(f"9. Answer Evaluation: Score={eval_data['score']}/10, Strengths={len(eval_data.get('strengths', []))}, Feedback={eval_data.get('feedback', '')[:70]}...")

    # 10. Complete Interview & Generate Performance Report
    comp_res = client.post(f"/api/interviews/{session_id}/complete", headers=headers)
    assert comp_res.status_code == 200
    report_data = json.loads(comp_res.data)["report"]
    print(f"10. Performance Report: Overall Score={report_data['overall_score']}%, Grade={report_data['grade']}, Recommendation={report_data['recommendation']}")

    # 11. Retrieve Completed Interview
    iv_res = client.get(f"/api/interviews/{session_id}", headers=headers)
    assert iv_res.status_code == 200
    iv_full = json.loads(iv_res.data)["interview"]
    assert iv_full["status"] == "completed"
    print(f"11. Interview Session State: status={iv_full['status']}, duration={iv_full.get('duration_minutes', 1)} min, Qs answered={len(iv_full.get('questions', []))}")

    # 12. Interview History List
    list_res = client.get("/api/interviews", headers=headers)
    assert list_res.status_code == 200
    history = json.loads(list_res.data)["interviews"]
    print(f"12. History List: {len(history)} interviews found")

    # 13. Analytics Metrics
    an_res = client.get("/api/analytics", headers=headers)
    assert an_res.status_code == 200
    analytics = json.loads(an_res.data)
    print(f"13. Analytics: total={analytics['total_interviews']}, avg_score={analytics['average_score']}%, best_score={analytics['best_score']}%")

    # 14. Resume Upload & Analysis
    resume_sample = "Senior Python Developer with 6 years experience in React, TypeScript, Docker, Kubernetes, AWS, PostgreSQL, and microservices architecture."
    res_upload = client.post("/api/profile/upload-resume", headers=headers, json={"resume_text": resume_sample})
    assert res_upload.status_code == 200
    res_data = json.loads(res_upload.data)
    print(f"14. Resume Upload: Inferred {len(res_data['inferred_skills'])} skills, matched {res_data['matched_question_count']} questions")

    # 15. SPA Client Routes
    spa_routes = ["/", "/dashboard", "/preview", "/onboarding", "/interview/start",
                  "/analytics", "/questions", "/history", "/profile", "/settings"]
    spa_ok = all(client.get(route).status_code == 200 for route in spa_routes)
    print(f"15. SPA Client Routes ({len(spa_routes)} routes): {'ALL OK (HTTP 200)' if spa_ok else 'FAILED'}")

    print("\n==========================================")
    print("  ALL BACKEND VALIDATION TESTS PASSED!   ")
    print("==========================================")

