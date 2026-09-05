"""Validation script for Interview Trainer backend."""
from app import app, db
import json

with app.app_context():
    db.create_all()
    client = app.test_client()

    print("=== BACKEND VALIDATION ===\n")

    # 1. Health
    r = client.get("/api/health")
    h = json.loads(r.data)
    model = h["model"]
    rag = h["rag"]
    version = h["version"]
    print(f"Health: model={model}, rag={rag}, version={version}")

    # 2. Register
    r = client.post("/api/auth/register", json={
        "email": "validate@demo.com", "password": "test123", "name": "Test User",
        "role": "Software Engineer", "experience": "Mid-level"
    })
    reg = json.loads(r.data)
    token = reg.get("token", "")
    print(f"Register: HTTP {r.status_code}, token={'YES' if token else 'NO'}")

    headers = {"Authorization": f"Bearer {token}"}

    # 3. Login
    r = client.post("/api/auth/login", json={"email": "validate@demo.com", "password": "test123"})
    print(f"Login: HTTP {r.status_code}")

    # 4. RAG industry profile
    r = client.get("/api/rag/industry-profile", headers=headers)
    ic = json.loads(r.data)
    role_name = ic["role"]
    skill_count = len(ic["context"].get("key_skills", []))
    print(f"Industry context: role={role_name}, skills={skill_count}")

    # 5. RAG preview
    r = client.post("/api/rag/preview-questions", headers=headers, json={
        "role": "Software Engineer", "difficulty": "Hard", "topics": ["Algorithms"]
    })
    pv = json.loads(r.data)
    print(f"RAG preview: {pv['total']} questions, personalized={pv['personalized']}")

    # 6. Question bank
    r = client.get("/api/questions", headers=headers)
    qb = json.loads(r.data)
    print(f"Question bank: {qb['total']} total questions")

    # 7. Start interview
    r = client.post("/api/interviews/start", headers=headers, json={
        "role": "Software Engineer", "difficulty": "Medium", "topics": ["Algorithms"]
    })
    iv = json.loads(r.data)
    session_id = iv["interview"]["session_id"]
    sid_short = session_id[:8]
    print(f"Start interview: session_id={sid_short}...")

    # 8. Analytics
    r = client.get("/api/analytics", headers=headers)
    an = json.loads(r.data)
    print(f"Analytics: total_interviews={an['total_interviews']}")

    # 9. Resume upload
    r = client.post("/api/profile/upload-resume", headers=headers, json={
        "resume_text": "Python React Docker Kubernetes CI/CD machine learning tensorflow AWS"
    })
    ru = json.loads(r.data)
    skill_count2 = len(ru.get("inferred_skills", []))
    print(f"Resume upload: inferred {skill_count2} skills, matched {ru.get('matched_question_count')} questions")

    # 10. All SPA routes
    spa_routes = ["/", "/dashboard", "/preview", "/onboarding", "/interview/start",
                  "/analytics", "/questions", "/history", "/profile", "/settings"]
    results = {route: client.get(route).status_code for route in spa_routes}
    all_ok = all(s == 200 for s in results.values())
    failed = [r for r, s in results.items() if s != 200]
    total = len(spa_routes)
    status_str = "ALL OK" if all_ok else f"FAILED: {failed}"
    print(f"SPA routes ({total} routes): {status_str}")

    print("\n=== ALL VALIDATION COMPLETE ===")
