# 🎯 Interview Trainer — AI-Powered Interview Practice

Built with **IBM Granite 4** (`ibm/granite-4-h-small`) via **watsonx.ai** and IBM watsonx Orchestrate.

---

## 🚀 Quick Start

### 1. Revoke & Rotate API Key
Your IBM Cloud API key was shared in chat and is compromised. Please:
1. Go to https://cloud.ibm.com/iam/apikeys
2. Delete the old key
3. Create a new API key
4. Paste it into `backend/config.env`

### 2. Update Credentials
Edit `backend/config.env`:
```
WATSONX_API_KEY=your_watsonx_api_key_here
WATSONX_PROJECT_ID=your_watsonx_project_id_here
WATSONX_MODEL_ID=ibm/granite-4-h-small
```

### 3. Start the Application
```powershell
.\start.ps1
```

Or manually:

**Backend** (Terminal 1):
```powershell
cd backend
python app.py
```

**Frontend** (Terminal 2):
```powershell
cd frontend
npm run dev
```

Open: **http://localhost:3000**

---

## 📁 Project Structure

```
├── backend/
│   ├── app.py              # Flask REST API
│   ├── watsonx_client.py   # IBM watsonx.ai client (Granite 4)
│   └── config.env          # API credentials (DO NOT COMMIT)
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Landing.jsx       # Marketing landing page
│       │   ├── Auth.jsx          # Login / Register
│       │   ├── Dashboard.jsx     # Main dashboard
│       │   ├── StartInterview.jsx # Interview setup wizard
│       │   ├── InterviewRoom.jsx  # 🌟 AI Interview Chat Room
│       │   ├── Report.jsx         # Performance report
│       │   ├── Analytics.jsx      # Charts & analytics
│       │   ├── QuestionBank.jsx   # Browse questions
│       │   ├── History.jsx        # Past interviews
│       │   ├── Profile.jsx        # User profile
│       │   └── Settings.jsx       # App settings
│       └── components/
│           └── Sidebar.jsx        # Navigation sidebar
│
├── agents/
│   └── interview_trainer_agent.yaml  # watsonx Orchestrate agent
│
├── tools/
│   └── interview_trainer_tools.py    # Orchestrate tools
│
└── start.ps1               # One-click start script
```

---

## 🌟 Features

| Feature | Description |
|---------|-------------|
| 🤖 AI Questions | IBM Granite 4 generates contextual questions |
| 📊 Real-time Scoring | Instant 1-10 scoring per answer |
| 🎤 Voice Input | Browser speech-to-text for answers |
| 📈 Analytics | Score trends, grade distribution charts |
| 📋 Full Reports | Radar charts, recommendations, next steps |
| 🗂️ Question Bank | 15+ curated questions with filtering |
| 🔐 Auth | JWT-based user authentication |

---

## 🤖 IBM Granite 4 Integration

- **Model**: `ibm/granite-4-h-small`
- **Platform**: IBM watsonx.ai (`us-south`)
- **Endpoint**: `https://us-south.ml.cloud.ibm.com/ml/v1/text/generation`
- **Uses**: Question generation, answer evaluation, report synthesis

---

## 🌐 Production Cloud Deployment

The repository includes ready-to-use configurations for one-click and containerized cloud deployment:
- **`render.yaml`**: One-click Blueprint deployment on Render (Free tier)
- **`Dockerfile`**: Multi-stage production container build (Node 20 + Python 3.11 + Gunicorn)
- **`Procfile`**: PaaS process definition (Railway, Render, Heroku)
- **`docker-compose.yml`**: Local and VM container orchestration

👉 **See the comprehensive [Deployment Guide](DEPLOYMENT.md) for step-by-step instructions on Render, Railway, Google Cloud Run, IBM Cloud Code Engine, and Linux VPS.**

---

## 🛡️ Security Notes

- **Never commit credentials** (`config.env`, `.env`, API keys, or tokens).
- The `.gitignore` and `.dockerignore` files are configured to strictly protect secrets and local database files.
- When deploying to any cloud platform, always inject `WATSONX_API_KEY`, `WATSONX_PROJECT_ID`, and `JWT_SECRET_KEY` through the platform's Environment Variables or Secrets manager.

