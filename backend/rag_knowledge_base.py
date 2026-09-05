"""
RAG Knowledge Base for Interview Trainer.
Contains role-specific questions, behavioral scenarios, industry expectations,
HR guidelines, and model answers — retrieved via keyword/semantic similarity.
"""

KNOWLEDGE_BASE = [
    # ─── SOFTWARE ENGINEER ───────────────────────────────────────────────────
    {
        "id": "se_001", "role": "Software Engineer", "category": "Data Structures",
        "difficulty": "Medium", "type": "technical",
        "question": "Explain the difference between an array and a linked list. When would you choose one over the other?",
        "model_answer": "Arrays offer O(1) random access but O(n) insertions/deletions. Linked lists offer O(1) insertions at head/tail but O(n) access. Choose arrays for frequent reads, linked lists for frequent insertions/deletions at arbitrary positions.",
        "keywords": ["array", "linked list", "data structure", "random access", "insertion", "deletion"],
        "industry_context": "Frequently asked at FAANG companies to test foundational CS knowledge.",
        "tips": "Mention cache locality advantage of arrays. Discuss doubly vs singly linked lists.",
    },
    {
        "id": "se_002", "role": "Software Engineer", "category": "Algorithms",
        "difficulty": "Hard", "type": "technical",
        "question": "How would you design a rate limiter? What algorithms can be used?",
        "model_answer": "Common algorithms: Token Bucket (allows bursts), Leaky Bucket (smooth rate), Fixed Window Counter (simple, edge cases), Sliding Window Log (accurate, memory heavy), Sliding Window Counter (balanced). For distributed systems, use Redis with atomic operations.",
        "keywords": ["rate limiter", "token bucket", "leaky bucket", "distributed", "redis"],
        "industry_context": "Common system design question at senior levels and API-heavy companies.",
        "tips": "Always discuss trade-offs. Mention Redis INCR with TTL for distributed rate limiting.",
    },
    {
        "id": "se_003", "role": "Software Engineer", "category": "System Design",
        "difficulty": "Hard", "type": "technical",
        "question": "Design a URL shortening service like bit.ly. Walk me through your architecture.",
        "model_answer": "Components: API server, ID generator (base62 encoding of auto-increment or hash), KV store (Redis for cache, Cassandra/DynamoDB for persistence), CDN for redirects. Handle collisions with retry logic. Consider analytics, custom aliases, expiry.",
        "keywords": ["url shortener", "base62", "hash", "cassandra", "redis", "cdn", "system design"],
        "industry_context": "Classic system design question testing breadth of architectural knowledge.",
        "tips": "Always start with requirements (scale, features). Estimate QPS before diving into components.",
    },
    {
        "id": "se_004", "role": "Software Engineer", "category": "OOP",
        "difficulty": "Easy", "type": "technical",
        "question": "What are the SOLID principles? Give an example of the Single Responsibility Principle.",
        "model_answer": "S: Single Responsibility — a class has one reason to change. O: Open/Closed — open for extension, closed for modification. L: Liskov Substitution — subtypes must be substitutable. I: Interface Segregation — many specific interfaces. D: Dependency Inversion — depend on abstractions.",
        "keywords": ["solid", "single responsibility", "open closed", "liskov", "interface segregation", "dependency inversion", "oop"],
        "industry_context": "Core OOP knowledge expected at all levels.",
        "tips": "Bring concrete code examples for each principle to stand out.",
    },
    {
        "id": "se_005", "role": "Software Engineer", "category": "Concurrency",
        "difficulty": "Hard", "type": "technical",
        "question": "Explain deadlock. How do you prevent it in a multi-threaded application?",
        "model_answer": "Deadlock occurs when two threads each hold a resource the other needs. Four Coffman conditions: mutual exclusion, hold & wait, no preemption, circular wait. Prevention: lock ordering, timeouts, try-lock with backoff, use higher-level concurrency primitives.",
        "keywords": ["deadlock", "mutex", "thread", "concurrency", "lock", "coffman"],
        "industry_context": "Important for backend/systems roles. Common at Microsoft, Amazon.",
        "tips": "Describe a real scenario. Mention banker's algorithm for deadlock avoidance.",
    },
    # ─── FRONTEND DEVELOPER ────────────────────────────────────────────────
    {
        "id": "fe_001", "role": "Frontend Developer", "category": "React",
        "difficulty": "Medium", "type": "technical",
        "question": "Explain the React reconciliation algorithm and how the virtual DOM works.",
        "model_answer": "React maintains a virtual DOM tree. On state change, it creates a new vDOM, diffs it against the old one (reconciliation), and batches minimal DOM updates. Key prop helps React identify list items. Fiber allows work to be split into chunks for concurrent features.",
        "keywords": ["virtual dom", "reconciliation", "fiber", "react", "diffing", "keys"],
        "industry_context": "Core React knowledge expected at mid to senior frontend roles.",
        "tips": "Mention React 18 concurrent mode and automatic batching as modern improvements.",
    },
    {
        "id": "fe_002", "role": "Frontend Developer", "category": "Performance",
        "difficulty": "Medium", "type": "technical",
        "question": "How would you optimize a slow React application? List specific techniques.",
        "model_answer": "Techniques: React.memo/useMemo/useCallback to prevent re-renders, code splitting with React.lazy/Suspense, virtualization (react-window) for long lists, image optimization (lazy loading, WebP), bundle analysis, avoiding inline objects in JSX, using production builds.",
        "keywords": ["performance", "react.memo", "usememo", "code splitting", "virtualization", "bundle"],
        "industry_context": "High-priority skill at product companies where UX quality matters.",
        "tips": "Use the React Profiler to identify bottlenecks. Mention Core Web Vitals metrics.",
    },
    # ─── DATA SCIENTIST ────────────────────────────────────────────────────
    {
        "id": "ds_001", "role": "Data Scientist", "category": "Machine Learning",
        "difficulty": "Medium", "type": "technical",
        "question": "Explain the bias-variance tradeoff. How does it affect model selection?",
        "model_answer": "High bias = underfitting (model too simple). High variance = overfitting (model too complex). The tradeoff is finding the sweet spot. Regularization (L1/L2) reduces variance. Cross-validation helps estimate generalization. Ensemble methods balance bias and variance.",
        "keywords": ["bias", "variance", "overfitting", "underfitting", "regularization", "cross-validation"],
        "industry_context": "Fundamental ML concept tested at all data science interviews.",
        "tips": "Draw the U-shaped error curve. Discuss how bagging reduces variance and boosting reduces bias.",
    },
    {
        "id": "ds_002", "role": "Data Scientist", "category": "Statistics",
        "difficulty": "Medium", "type": "technical",
        "question": "What is p-value and how do you interpret it? What are its limitations?",
        "model_answer": "P-value is the probability of observing results at least as extreme as the data, assuming H0 is true. p < 0.05 = reject null. Limitations: doesn't measure effect size, affected by sample size, multiple testing inflates false positives. Use confidence intervals and effect size alongside p-value.",
        "keywords": ["p-value", "hypothesis testing", "null hypothesis", "significance", "type 1 error"],
        "industry_context": "Core statistics knowledge for data science and A/B testing roles.",
        "tips": "Mention the difference between statistical and practical significance. Discuss Bonferroni correction.",
    },
    # ─── DEVOPS ENGINEER ────────────────────────────────────────────────────
    {
        "id": "do_001", "role": "DevOps Engineer", "category": "CI/CD",
        "difficulty": "Medium", "type": "technical",
        "question": "Describe your ideal CI/CD pipeline. What stages would you include?",
        "model_answer": "Stages: Source (git trigger) → Build (compile, Docker image) → Test (unit, integration, security scan) → Staging deploy → Acceptance tests → Production deploy (blue-green or canary) → Monitoring. Tools: Jenkins/GitHub Actions, SonarQube, Kubernetes, Prometheus.",
        "keywords": ["ci/cd", "pipeline", "jenkins", "github actions", "docker", "kubernetes", "blue-green"],
        "industry_context": "Core DevOps workflow knowledge tested at cloud-native companies.",
        "tips": "Emphasize shift-left testing. Mention feature flags for gradual rollouts.",
    },
    # ─── PRODUCT MANAGER ───────────────────────────────────────────────────
    {
        "id": "pm_001", "role": "Product Manager", "category": "Product Strategy",
        "difficulty": "Medium", "type": "technical",
        "question": "How do you prioritize features in a product roadmap? What frameworks do you use?",
        "model_answer": "Frameworks: RICE (Reach × Impact × Confidence / Effort), MoSCoW (Must/Should/Could/Won't), Kano Model (basic/performance/delight). Always align with business goals, user research, and OKRs. Consider technical debt and dependencies. Communicate trade-offs to stakeholders.",
        "keywords": ["roadmap", "prioritization", "rice", "moscow", "kano", "okr", "stakeholder"],
        "industry_context": "Tested at all PM roles from associate to director level.",
        "tips": "Always mention user data and qualitative research alongside frameworks. Show strategic thinking.",
    },
    # ─── BEHAVIORAL (ALL ROLES) ────────────────────────────────────────────
    {
        "id": "beh_001", "role": "All", "category": "Behavioral",
        "difficulty": "Easy", "type": "behavioral",
        "question": "Tell me about a time you had to handle a conflict with a teammate.",
        "model_answer": "Use STAR: Situation (describe the conflict context), Task (your responsibility), Action (how you approached resolution — active listening, finding common ground, involving manager if needed), Result (positive outcome, relationship preserved, lesson learned).",
        "keywords": ["conflict", "teamwork", "communication", "collaboration", "resolution"],
        "industry_context": "Universal behavioral question tested at every company. Critical for team-fit assessment.",
        "tips": "Focus on what you did, not what the other person did wrong. Show empathy and professionalism.",
    },
    {
        "id": "beh_002", "role": "All", "category": "Behavioral",
        "difficulty": "Easy", "type": "behavioral",
        "question": "Describe a situation where you had to learn a new technology quickly to deliver a project.",
        "model_answer": "STAR: Situation (tight deadline with unfamiliar stack), Task (deliver feature X), Action (structured learning — docs, tutorials, pair programming, proof of concept), Result (delivered on time, upskilled team, created internal documentation).",
        "keywords": ["learning", "adaptability", "new technology", "fast learner", "self-driven"],
        "industry_context": "Assesses growth mindset and adaptability — valued at all companies.",
        "tips": "Quantify the time frame. Show how your learning helped the broader team.",
    },
    {
        "id": "beh_003", "role": "All", "category": "Behavioral",
        "difficulty": "Medium", "type": "behavioral",
        "question": "Tell me about a project you're most proud of and why.",
        "model_answer": "Choose a project with clear impact. STAR format: technical challenge, your specific contribution, measurable outcome (users impacted, % improvement, revenue). Explain what made it meaningful — novel problem, teamwork, learning, or user impact.",
        "keywords": ["proud", "achievement", "impact", "project", "contribution"],
        "industry_context": "Reveals what candidates value and their level of ownership.",
        "tips": "Pick something with quantifiable impact. Show passion — interviewers remember authentic answers.",
    },
    {
        "id": "beh_004", "role": "All", "category": "Leadership",
        "difficulty": "Medium", "type": "behavioral",
        "question": "Give an example of when you led a team through a difficult situation.",
        "model_answer": "STAR: Crisis or ambiguous situation, your leadership role (formal or informal), actions taken (clear communication, breaking problem down, delegating, maintaining morale), result (team succeeded, learned from failure, shipped product).",
        "keywords": ["leadership", "team", "difficult", "challenge", "manage", "decision"],
        "industry_context": "Critical for senior roles and any leadership track position.",
        "tips": "Leadership doesn't require a title. Show initiative and how you influenced without authority.",
    },
    {
        "id": "beh_005", "role": "All", "category": "HR",
        "difficulty": "Easy", "type": "hr",
        "question": "Where do you see yourself in 5 years?",
        "model_answer": "Show ambition aligned with the role. Example: 'I want to grow from a strong individual contributor to a technical lead who mentors others. I'm excited about the opportunity here to work on large-scale systems and grow alongside the team.' Avoid overly rigid timelines.",
        "keywords": ["career", "goals", "growth", "future", "ambition"],
        "industry_context": "HR screening question to assess ambition and retention likelihood.",
        "tips": "Align your goals with the company's trajectory. Show commitment without being unrealistic.",
    },
    {
        "id": "beh_006", "role": "All", "category": "HR",
        "difficulty": "Easy", "type": "hr",
        "question": "What is your biggest weakness?",
        "model_answer": "Choose a real weakness that is not a core job requirement. Show self-awareness and active improvement. Example: 'I used to struggle with delegating tasks. I've actively worked on it by building trust in teammates and setting clear expectations. I've seen my team's velocity improve as a result.'",
        "keywords": ["weakness", "self-awareness", "improvement", "growth"],
        "industry_context": "Tests self-awareness and honesty. Interviewers see through fake weaknesses.",
        "tips": "Never say 'I work too hard.' Show genuine reflection and concrete steps you've taken.",
    },
    # ─── ML ENGINEER ───────────────────────────────────────────────────────
    {
        "id": "mle_001", "role": "ML Engineer", "category": "MLOps",
        "difficulty": "Medium", "type": "technical",
        "question": "How do you monitor a machine learning model in production? What metrics do you track?",
        "model_answer": "Track: data drift (input distribution shift), concept drift (relationship between input/output changes), model performance metrics (accuracy, F1, AUC), latency, throughput, error rates. Tools: Evidently AI, Seldon, MLflow, custom dashboards. Set up alerting thresholds.",
        "keywords": ["mlops", "model monitoring", "data drift", "concept drift", "production", "mlflow"],
        "industry_context": "Critical skill for ML Engineer roles at scale-up companies and enterprises.",
        "tips": "Mention shadow mode deployment for safely testing new models. Discuss retraining triggers.",
    },
    # ─── FULL STACK DEVELOPER ──────────────────────────────────────────────
    {
        "id": "fs_001", "role": "Full Stack Developer", "category": "Architecture",
        "difficulty": "Medium", "type": "technical",
        "question": "Explain RESTful API design principles. How is it different from GraphQL?",
        "model_answer": "REST: stateless, resource-based URLs, HTTP verbs (GET/POST/PUT/DELETE), standard status codes. GraphQL: single endpoint, client specifies exact data shape, reduces over/under-fetching, strongly typed schema. REST better for simple CRUD; GraphQL better for complex, interconnected data with diverse clients.",
        "keywords": ["rest", "graphql", "api design", "stateless", "http", "endpoint"],
        "industry_context": "Expected knowledge for any full-stack or backend role.",
        "tips": "Mention REST maturity levels (Richardson model). Discuss when NOT to use GraphQL.",
    },
    # ─── CLOUD ARCHITECT ───────────────────────────────────────────────────
    {
        "id": "ca_001", "role": "Cloud Architect", "category": "Architecture",
        "difficulty": "Hard", "type": "technical",
        "question": "What is the CAP theorem and how does it affect your database choices?",
        "model_answer": "CAP: a distributed system can only guarantee 2 of 3: Consistency, Availability, Partition Tolerance. Since P is inevitable in distributed systems, choose CA (traditional RDBMS, no partitioning) or CP (HBase, Zookeeper — consistent but may be unavailable) or AP (Cassandra, DynamoDB — available but eventually consistent).",
        "keywords": ["cap theorem", "consistency", "availability", "partition", "cassandra", "distributed"],
        "industry_context": "Fundamental distributed systems knowledge for architect and senior backend roles.",
        "tips": "PACELC is an extension of CAP that also considers latency. Mention BASE vs ACID.",
    },
]

# Role-to-industry expectations map
INDUSTRY_EXPECTATIONS = {
    "Software Engineer": {
        "key_skills": ["Data Structures & Algorithms", "System Design", "OOP/Clean Code", "Debugging", "Version Control"],
        "typical_rounds": ["Phone Screen", "DSA Coding", "System Design", "Behavioral", "Culture Fit"],
        "top_companies": ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix"],
        "prep_resources": ["LeetCode", "System Design Primer", "Clean Code (book)", "DDIA (book)"],
        "avg_interview_duration": "4-6 hours total across rounds",
        "success_tips": "Focus on thinking out loud, edge cases, and iterative refinement rather than rushing to code.",
    },
    "Data Scientist": {
        "key_skills": ["Statistics & Probability", "Machine Learning", "Python/R", "SQL", "Data Storytelling"],
        "typical_rounds": ["SQL/Coding Screen", "Statistics Assessment", "ML Case Study", "Behavioral"],
        "top_companies": ["Netflix", "Airbnb", "Spotify", "LinkedIn", "Two Sigma"],
        "prep_resources": ["StatQuest (YouTube)", "Hands-On ML (book)", "Kaggle", "SQL Zoo"],
        "avg_interview_duration": "3-5 hours total",
        "success_tips": "Always explain your reasoning behind model/algorithm choices. Business context matters as much as technical accuracy.",
    },
    "Frontend Developer": {
        "key_skills": ["JavaScript/TypeScript", "React/Vue/Angular", "CSS/HTML", "Performance", "Testing"],
        "typical_rounds": ["Coding Screen", "UI Implementation", "System Design (Frontend)", "Behavioral"],
        "top_companies": ["Stripe", "Figma", "Vercel", "Shopify", "Meta"],
        "prep_resources": ["JavaScript.info", "Frontend Masters", "CSS Tricks", "web.dev"],
        "avg_interview_duration": "3-4 hours total",
        "success_tips": "Build accessible, responsive UIs. Know Core Web Vitals and browser internals.",
    },
    "DevOps Engineer": {
        "key_skills": ["Kubernetes", "Docker", "CI/CD", "Infrastructure as Code", "Cloud Platforms", "Monitoring"],
        "typical_rounds": ["Technical Screen", "Hands-on Lab", "System Design", "Behavioral"],
        "top_companies": ["HashiCorp", "Datadog", "GitLab", "Cloudflare", "AWS"],
        "prep_resources": ["Kubernetes Docs", "Terraform Docs", "The DevOps Handbook", "Linux Foundation courses"],
        "avg_interview_duration": "3-5 hours",
        "success_tips": "Show automation mindset. Discuss reliability and observability as first-class concerns.",
    },
    "Product Manager": {
        "key_skills": ["Product Strategy", "User Research", "Data Analysis", "Roadmapping", "Stakeholder Management"],
        "typical_rounds": ["Estimation", "Product Design", "Analytical/Metrics", "Strategy", "Behavioral"],
        "top_companies": ["Google", "Meta", "Amazon", "Airbnb", "Stripe"],
        "prep_resources": ["Cracking the PM Interview (book)", "DECODE and CONQUER (book)", "Lenny's Newsletter"],
        "avg_interview_duration": "4-6 hours",
        "success_tips": "Always tie decisions back to user value and business metrics. Structure your answers clearly.",
    },
    "ML Engineer": {
        "key_skills": ["ML Frameworks (PyTorch/TF)", "MLOps", "Python", "Distributed Computing", "Algorithms"],
        "typical_rounds": ["Coding Screen", "ML Theory", "System Design (ML)", "Behavioral"],
        "top_companies": ["OpenAI", "DeepMind", "Waymo", "Nvidia", "Hugging Face"],
        "prep_resources": ["fast.ai", "Papers With Code", "MLOps Community", "Chip Huyen's MLSys Design"],
        "avg_interview_duration": "4-5 hours",
        "success_tips": "Show production ML experience — training, evaluation, deployment, monitoring. Theory alone isn't enough.",
    },
    "Full Stack Developer": {
        "key_skills": ["JavaScript/TypeScript", "React", "Node.js", "Databases", "REST/GraphQL", "DevOps basics"],
        "typical_rounds": ["Coding Screen", "Full Stack Implementation", "System Design", "Behavioral"],
        "top_companies": ["Stripe", "Notion", "Linear", "GitHub", "Vercel"],
        "prep_resources": ["Full Stack Open", "The Odin Project", "Node.js Docs"],
        "avg_interview_duration": "3-5 hours",
        "success_tips": "Show end-to-end thinking. Security, performance, and scalability should be natural parts of your design.",
    },
    "Cloud Architect": {
        "key_skills": ["AWS/Azure/GCP", "Distributed Systems", "Security", "Cost Optimization", "IaC"],
        "typical_rounds": ["Architecture Design", "Security Review", "Cost Analysis", "Behavioral"],
        "top_companies": ["AWS", "Microsoft Azure", "Google Cloud", "Accenture", "Deloitte"],
        "prep_resources": ["AWS Well-Architected Framework", "Cloud Architecture Patterns", "GCP cert prep"],
        "avg_interview_duration": "4-6 hours",
        "success_tips": "Always consider the 5 pillars: operational excellence, security, reliability, performance efficiency, cost optimization.",
    },
}


def retrieve_questions(role: str, difficulty: str = None, category: str = None,
                       keywords: list = None, limit: int = 10) -> list:
    """RAG retrieval: return relevant questions for a given role and context."""
    results = []
    role_normalized = role.strip()

    for item in KNOWLEDGE_BASE:
        score = 0
        # Role match
        if item["role"] == role_normalized or item["role"] == "All":
            score += 3
        elif any(word in role_normalized.lower() for word in item["role"].lower().split()):
            score += 1

        # Difficulty match
        if difficulty and item["difficulty"] == difficulty:
            score += 2

        # Category match
        if category and category.lower() in item["category"].lower():
            score += 2

        # Keyword match
        if keywords:
            kw_matches = sum(1 for kw in keywords if any(kw.lower() in ik for ik in item["keywords"]))
            score += kw_matches

        if score > 0:
            results.append({**item, "_score": score})

    results.sort(key=lambda x: x["_score"], reverse=True)
    return results[:limit]


def retrieve_industry_context(role: str) -> dict:
    """Retrieve industry expectations for a given role."""
    for key, val in INDUSTRY_EXPECTATIONS.items():
        if key.lower() in role.lower() or role.lower() in key.lower():
            return {"role": key, **val}
    # Default fallback
    return INDUSTRY_EXPECTATIONS.get("Software Engineer", {})


def search_by_resume_keywords(resume_text: str, role: str) -> list:
    """Extract keywords from resume text and retrieve relevant questions."""
    TECH_KEYWORDS = [
        "python", "java", "javascript", "typescript", "react", "node", "sql", "nosql",
        "aws", "gcp", "azure", "docker", "kubernetes", "ci/cd", "machine learning",
        "deep learning", "tensorflow", "pytorch", "data structures", "algorithms",
        "microservices", "rest", "graphql", "redis", "kafka", "spark", "hadoop",
        "agile", "scrum", "devops", "terraform", "ansible", "linux", "git",
    ]
    found = [kw for kw in TECH_KEYWORDS if kw.lower() in resume_text.lower()]
    return retrieve_questions(role=role, keywords=found, limit=8)
