# Apravas Recruitment Platform - Local Demo

A comprehensive India-Israel manpower recruitment platform with three professional dashboards (Admin, Employer, Worker) running with dummy data.

---

## Setup instructions (where to look)

| Goal | Where |
|------|-------|
| **Quick local run** | [Quick Start](#quick-start) below, or [SETUP.md](SETUP.md) |
| **Docker + production-style deploy** (health check, rollback) | [DEPLOY.md](DEPLOY.md) → `./deploy.sh deploy` |
| **Deploy on AWS EC2** | [DEPLOY.md](DEPLOY.md) (full steps: launch, Docker, `deploy.sh`, systemd) |
| **Production** | [http://43.204.127.118:8081](http://43.204.127.118:8081) — set `APP_PORT=8081` in `.env`, open TCP 8081; see [DEPLOY.md](DEPLOY.md) |

---

## Features

- **Apravas Admin Dashboard**: Complete analytics, pipeline management, financial tracking, and predictive insights
- **Israeli Employer Dashboard**: Job management, candidate pipeline, performance metrics, and compliance tracking
- **Worker Dashboard**: Application tracking, document management, skills assessment, and learning resources
- **Dummy Data**: All dashboards populated with realistic mock data for demonstration

## Quick Start

### Option A: Docker (recommended for local and deployment)

**Prerequisites:** Docker and Docker Compose

```bash
docker compose up --build
# Or in background: docker compose up --build -d
```

- **App:** http://localhost (port 80)  
- **API:** http://localhost/api/...

For production-style deploy (health check + rollback on failure): `./deploy.sh deploy` — see [DEPLOY.md](DEPLOY.md). Create `.env` from `.env.example` before first run (`cp .env.example .env`); `deploy.sh` checks for it.  
For EC2: [DEPLOY.md](DEPLOY.md).

### Option B: Node.js

**Prerequisites:** Node.js 16+ and npm

1. **Install all dependencies:**
```bash
npm run install:all
```

Or manually:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

2. **Run both frontend and backend:**
```bash
npm run dev
```

**Or run separately:**  
Terminal 1: `cd backend && npm run dev`  
Terminal 2: `cd frontend && npm run dev`

### Access the Application

- **Docker:** Homepage → http://localhost (port 80). API → http://localhost/api/...
- **Node.js:** Homepage → http://localhost:3000. API → http://localhost:5000

On the homepage: role selection, quick login, **AI Chatbot** (bottom-right).

### Demo Login

On the login page, you can:
- Select a role (Admin, Employer, Worker)
- Use quick login buttons for instant access
- Or manually enter email and role

**Quick Login Credentials:**
- **Admin**: Click "Quick: Admin" button
- **Employer**: Click "Quick: Employer" button  
- **Worker**: Click "Quick: Worker" button

## Dashboard URLs

After logging in, you'll be redirected to:
- **Admin Dashboard**: `/dashboard/admin`
- **Employer Dashboard**: `/dashboard/employer`
- **Worker Dashboard**: `/dashboard/worker`

## Project Structure

```
apravas-recruitment-platform/
├── backend/
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── dashboards.js    # Dashboard data endpoints
│   │   └── analytics.js     # Analytics endpoints
│   ├── services/
│   │   └── mockData.js      # Mock data generators
│   └── server.js            # Express server
├── frontend/
│   ├── components/
│   │   ├── Dashboards/
│   │   │   ├── ApravasAdminDashboard.js
│   │   │   ├── IsraeliEmployerDashboard.js
│   │   │   └── WorkerDashboard.js
│   │   └── Layout/
│   │       └── MainLayout.js
│   ├── pages/
│   │   ├── index.js         # Login page
│   │   └── dashboard/
│   │       ├── admin.js
│   │       ├── employer.js
│   │       └── worker.js
│   └── utils/
│       └── api.js           # API client
└── package.json
```

## Features Overview

### Homepage
- **Beautiful landing page** with hero section
- Feature highlights (GDPR Compliant, Real-time Analytics, Multi-language)
- Role-based login (Admin, Employer, Worker)
- **AI Chatbot** - Floating button in bottom-right corner
- Quick login buttons for instant access

### AI Chatbot
- **Available on homepage and all dashboards**
- Click the "Ask AI Assistant" button (bottom-right)
- Answers questions about:
  - Visa processes and work permits
  - Skill requirements for jobs
  - Employer verification
  - Salary and benefits
  - Recruitment procedures
- GDPR compliant with consent management
- Quick prompt buttons for common questions

### Apravas Admin Dashboard
- Executive summary with KPIs
- Real-time metrics
- Pipeline analytics with stage-wise tracking
- Financial analytics and revenue trends
- Predictive insights and risk analysis
- Skill demand visualization
- **AI Chatbot available**

### Israeli Employer Dashboard
- Job posting management
- Candidate pipeline tracking
- Performance metrics and analytics
- Compliance status monitoring
- Application review tools
- **AI Chatbot available**

### Worker Dashboard
- Application status tracking
- Document management
- Skills assessment and scoring
- Learning recommendations
- Timeline visualization
- Mobile-responsive design
- **AI Chatbot available**

## Technology Stack

**Frontend:**
- Next.js 14
- React 18
- Material-UI (MUI)
- Recharts for data visualization

**Backend:**
- Node.js
- Express.js
- Mock data services

## Development Notes

- All data is generated using mock data services
- No database connection required for demo
- Authentication is simplified for demo purposes
- All dashboards are fully functional with realistic dummy data

## Troubleshooting

**Code changes not showing in the browser?**

| How you run the app | What to do |
|---------------------|------------|
| **Production server** (EC2, http://43.204.127.118:8081, Docker) | **`git push` alone does not update the server.** On the EC2 machine: `cd` into the project (e.g. `~/indo-israel` or `~/git-project/indo-israel`), run `git pull`, then `./deploy.sh deploy`. That rebuilds the images from the new code and restarts the stack. See [DEPLOY.md](DEPLOY.md) §7. |
| **Docker** (`docker compose up`, or production at :80 / :8081) | The app serves a **built** copy of the code. You must **rebuild** after edits: `docker compose build frontend && docker compose up -d` (or `docker compose up -d --build`). |
| **Local dev** (`cd frontend && npm run dev` at http://localhost:3000) | 1. Save the file. 2. If it still doesn’t update: stop the dev server, run `npm run dev:fresh` (clears `.next` and starts dev), then **hard refresh** the page (Ctrl+Shift+R or Cmd+Shift+R). If needed, try an incognito/private window to rule out browser cache. |

**Port already in use:**
- Backend: Change PORT in `backend/server.js` or use environment variable
- Frontend: Change port in `frontend/package.json` dev script

**CORS issues:**
- Ensure backend is running before frontend
- Check that backend CORS is enabled (already configured)

**Data not loading:**
- Verify backend is running on port 5000
- Check browser console for API errors
- Ensure you're logged in with a valid role

## Next Steps

To make this production-ready:
1. Connect to real database (PostgreSQL/MongoDB)
2. Implement proper authentication (JWT)
3. Add real API integrations
4. Set up environment variables
5. Add error handling and validation
6. Implement real-time updates with WebSockets

## License

ISC
