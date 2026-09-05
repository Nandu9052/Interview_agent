# 🚀 Deployment Guide — AI Interview Trainer Agent

This application is built with a **unified production architecture**:
- The **React SPA** (`frontend/`) is compiled into production static assets (`frontend/dist`).
- The **Flask Backend** (`backend/`) serves both the REST API endpoints (`/api/*`) and the React frontend from a single web service.
- **IBM Granite 4** (`ibm/granite-4-h-small`) provides intelligent question generation, answer evaluation, and real-time coaching via watsonx.ai.

Because the app is unified, you only need to deploy **one service** to host the entire full-stack application!

---

## 🔒 Security Best Practices (Read Before Deploying)

> [!IMPORTANT]
> - **Never hardcode credentials** into any files or commit them to Git.
> - Always supply your `WATSONX_API_KEY`, `WATSONX_PROJECT_ID`, and `JWT_SECRET_KEY` through the hosting platform's **Environment Variables / Secrets Manager**.
> - The `.gitignore` file is configured to keep all `.env` files and local databases out of your Git repository.

---

## 📋 Required Environment Variables

| Variable | Description | Example / Default | Required? |
| :--- | :--- | :--- | :--- |
| `WATSONX_API_KEY` | Your IBM Cloud IAM API Key | `ABc123xyz...` | **Yes** |
| `WATSONX_PROJECT_ID` | Your watsonx.ai Project GUID | `a1b2c3d4-5678-90ef...` | **Yes** |
| `WATSONX_MODEL_ID` | Granite model ID | `ibm/granite-4-h-small` | Optional |
| `WATSONX_URL` | watsonx.ai instance URL | `https://us-south.ml.cloud.ibm.com` | Optional |
| `JWT_SECRET_KEY` | Secret for user session tokens | Strong random string | **Yes** (or auto-gen) |
| `FLASK_ENV` | Environment mode | `production` | Optional |
| `DATABASE_URL` | SQL database connection URI | `sqlite:///interview_trainer.db` | Optional |

---

## 🌐 Option 1: Deploy on Render.com (Recommended — Free & Easiest)

Render provides free hosting with automatic HTTPS, continuous deployment from GitHub, and automated builds.

### Step 1: Push code to your GitHub repository
Ensure your code is pushed to your GitHub repository:
```bash
git push origin main
```

### Step 2: Create a Web Service on Render
1. Go to [dashboard.render.com](https://dashboard.render.com) and log in.
2. Click **New +** in the top right corner and choose **Web Service**.
3. Connect your GitHub account and select your repository: **`Interview_agent`** (or `Nandu9052/Interview_agent`).

### Step 3: Configure Service Settings
- **Name**: `interview-trainer` (or your preferred name)
- **Region**: Oregon (US West) or Frankfurt (EU)
- **Branch**: `main`
- **Root Directory**: *(Leave empty)*
- **Runtime**: `Python 3`
- **Build Command**:
  ```bash
  cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt
  ```
- **Start Command**:
  ```bash
  gunicorn --chdir backend app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
  ```
- **Instance Type**: `Free`

### Step 4: Add Environment Variables
Under the **Environment Variables** section, click **Add Environment Variable** and enter:
1. `PYTHON_VERSION` = `3.11.9`
2. `NODE_VERSION` = `20.12.2`
3. `FLASK_ENV` = `production`
4. `WATSONX_API_KEY` = `Your IBM Cloud API Key`
5. `WATSONX_PROJECT_ID` = `Your watsonx.ai Project ID`
6. `WATSONX_MODEL_ID` = `ibm/granite-4-h-small`
7. `WATSONX_URL` = `https://us-south.ml.cloud.ibm.com`
8. `JWT_SECRET_KEY` = *(Click "Generate" or type a random 32-character string)*

### Step 5: Deploy
Click **Create Web Service**.
Render will:
1. Clone your repo.
2. Run `npm install` and compile the React application.
3. Install Python dependencies (`Flask`, `gunicorn`, `ibm-cloud-sdk-core`, etc.).
4. Launch the application on a secure public URL (e.g., `https://interview-trainer-xxxx.onrender.com`).

---

## 🚂 Option 2: Deploy on Railway.app

Railway detects the included `Dockerfile` and deploys automatically.

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `Nandu9052/Interview_agent`.
4. Go to **Variables** tab and add:
   - `WATSONX_API_KEY`: Your key
   - `WATSONX_PROJECT_ID`: Your project ID
   - `WATSONX_MODEL_ID`: `ibm/granite-4-h-small`
   - `WATSONX_URL`: `https://us-south.ml.cloud.ibm.com`
   - `JWT_SECRET_KEY`: Random secret string
5. Go to **Settings** → **Networking** → Click **Generate Domain**.
6. Railway will build the multi-stage Docker image and provide your live URL.

---

## 🐳 Option 3: Deploy with Docker / Cloud Run / IBM Code Engine

A production-ready multi-stage `Dockerfile` is provided in the repository root.

### Build and Test Locally:
```bash
# Build the multi-stage container
docker build -t interview-trainer .

# Run container with environment variables
docker run -d -p 5000:5000 \
  -e WATSONX_API_KEY="your_api_key" \
  -e WATSONX_PROJECT_ID="your_project_id" \
  -e JWT_SECRET_KEY="your_secret_key" \
  --name interview-app interview-trainer

# Open in browser
open http://localhost:5000
```

### Deploy to Google Cloud Run:
```bash
# Set project
gcloud config set project YOUR_GCP_PROJECT_ID

# Build and submit image
gcloud builds submit --tag gcr.io/YOUR_GCP_PROJECT_ID/interview-trainer

# Deploy to Cloud Run
gcloud run deploy interview-trainer \
  --image gcr.io/YOUR_GCP_PROJECT_ID/interview-trainer \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars WATSONX_API_KEY="your_key",WATSONX_PROJECT_ID="your_project_id",JWT_SECRET_KEY="your_secret"
```

### Deploy to IBM Cloud Code Engine:
```bash
# Target resource group & region
ibmcloud target -g Default -r us-south

# Create project
ibmcloud ce project create --name interview-trainer-proj
ibmcloud ce project select --name interview-trainer-proj

# Create and run application from source repository
ibmcloud ce app create --name interview-trainer \
  --build-source https://github.com/Nandu9052/Interview_agent.git \
  --env WATSONX_API_KEY="your_key" \
  --env WATSONX_PROJECT_ID="your_project_id" \
  --env JWT_SECRET_KEY="your_secret" \
  --port 5000
```

---

## 💻 Option 4: Deploy on a Linux VPS (Ubuntu / Debian / EC2 / DigitalOcean)

### 1. Clone repository & install dependencies:
```bash
git clone https://github.com/Nandu9052/Interview_agent.git
cd Interview_agent

# Install Node & Python if not present
sudo apt update && sudo apt install -y python3-pip python3-venv nodejs npm

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Setup backend venv
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

### 2. Configure Systemd Service (`/etc/systemd/system/interview-trainer.service`):
```ini
[Unit]
Description=AI Interview Trainer Agent
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/Interview_agent/backend
Environment="PATH=/home/ubuntu/Interview_agent/venv/bin"
Environment="WATSONX_API_KEY=your_ibm_api_key"
Environment="WATSONX_PROJECT_ID=your_watsonx_project_id"
Environment="WATSONX_MODEL_ID=ibm/granite-4-h-small"
Environment="WATSONX_URL=https://us-south.ml.cloud.ibm.com"
Environment="JWT_SECRET_KEY=your_super_secret_jwt_key"
Environment="PORT=5000"
ExecStart=/home/ubuntu/Interview_agent/venv/bin/gunicorn app:app --bind 0.0.0.0:5000 --workers 3 --timeout 120

[Install]
WantedBy=multi-user.target
```

### 3. Start and enable service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now interview-trainer
sudo systemctl status interview-trainer
```

---

## ✅ Post-Deployment Verification Checklist

Once deployed, verify everything is operating properly:

1. **Health Check Endpoint**:
   Visit `https://YOUR_APP_URL/api/health`.
   Response should be:
   ```json
   {
     "status": "ok",
     "model": "ibm/granite-4-h-small",
     "rag": "enabled",
     "version": "2.0"
   }
   ```
2. **Frontend UI**:
   Open `https://YOUR_APP_URL` in a browser. The modern React dark-mode dashboard should render seamlessly.
3. **Register/Login Flow**:
   Create a new account or log in with test credentials.
4. **AI Generation & Evaluation**:
   Start an interview simulation (e.g. *Full Stack Developer*, *System Design*, etc.) and submit an answer. Verify that IBM Granite 4 evaluates the response and offers structured feedback.
