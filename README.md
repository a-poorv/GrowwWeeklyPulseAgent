# Groww Weekly Pulse Agent

A sophisticated AI-powered analysis system that aggregates user reviews from the Groww investment app and generates actionable insights through automated email reports. Built with a modern full-stack architecture combining real-time data processing, AI analysis, and scheduled email delivery.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Key Implementations](#key-implementations)

---

## 🎯 Project Overview

**Groww Weekly Pulse Agent** is an intelligent feedback analysis platform that:

1. **Fetches Reviews**: Scrapes real app store reviews from both Google Play Store and Apple App Store
2. **Analyzes with AI**: Uses Groq's LLaMA model with Map-Reduce pattern for efficient processing
3. **Generates Insights**: Creates structured reports with themes, urgency ratings, and actionable recommendations
4. **Delivers Reports**: Sends formatted HTML emails via Brevo API on a schedule
5. **Visualizes Data**: Provides a real-time dashboard for monitoring trends

**Key Value Proposition**: Automates the tedious process of review analysis, turning hundreds of reviews into actionable business insights.

---

## 🏗️ Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                     Groww Weekly Pulse System                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📱 FRONTEND (Vercel)           🖥️  BACKEND (Railway)          │
│  ┌──────────────────────┐       ┌──────────────────────┐        │
│  │  React Dashboard     │       │  Node.js/Express     │        │
│  │  - Vite Build        │       │  - REST API          │        │
│  │  - Recharts Charts   │       │  - Job Scheduler     │        │
│  │  - Real-time Updates │       │  - Email Service     │        │
│  │  - Email Trigger     │       │  - AI Integration    │        │
│  └──────────────────────┘       └──────────────────────┘        │
│           │                              │                     │
│           └──────────────┬───────────────┘                     │
│                          │                                     │
│                    ┌─────▼──────┐                              │
│                    │  MongoDB   │                              │
│                    │  Atlas     │                              │
│                    │  (pulse_db)│                              │
│                    └────────────┘                              │
│                                                                 │
│  📊 EXTERNAL SERVICES                                          │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Google Play     │  │ Apple App    │  │ Groq LLaMA       │  │
│  │ Store Scraper   │  │ Store        │  │ (AI Analysis)    │  │
│  └─────────────────┘  └──────────────┘  └──────────────────┘  │
│                                                                 │
│  📧 EMAIL DELIVERY                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Brevo HTTP API (SMTP v3/HTTP replacement)               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Pipeline

```
Review Fetching
    ↓
[Google Play Store] [Apple App Store]
    ↓
    └─→ Aggregate Reviews (1-8 weeks)
        ↓
    LLM Analysis (Map-Reduce)
        ├─→ Map Phase: Chunk reviews (30 reviews/chunk)
        │   ├─→ Each chunk → Groq LLaMA 3.1 8B
        │   └─→ Extract: themes, quotes, micro-insights
        ├─→ Reduce Phase: Combine all chunks
        │   └─→ Final insights with urgency levels
        ↓
    Generate Report
        ├─→ Structure data for dashboard
        └─→ Structure data for email
        ↓
    Store in MongoDB
        ├─→ Cache for dashboard
        └─→ Reference for emails
        ↓
    Send Email (Brevo API)
        └─→ HTML formatted report
```

---

## 🛠️ Technology Stack

### Backend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js 18+ | JavaScript runtime |
| **Framework** | Express 5.2.1 | REST API server |
| **Database** | MongoDB (Atlas) | Document storage for pulse reports |
| **ODM** | Mongoose 9.3.0 | MongoDB object modeling |
| **AI/LLM** | Groq SDK 0.37.0 | LLaMA 3.1 8B model access |
| **Scheduling** | node-cron 4.2.1 | Cron job scheduling |
| **Email** | Brevo API | SMTP v3 replacement (HTTP-based) |
| **Scraping** | google-play-scraper 10.1.2 | Play Store reviews |
| |  app-store-scraper 0.18.0 | App Store reviews |
| **HTTP Client** | axios 1.13.6 | API requests |
| **Utilities** | uuid 9.0.1 | Unique ID generation |
| **CORS** | cors 2.8.6 | Cross-origin requests |
| **Config** | dotenv 17.3.1 | Environment variables |

### Frontend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Library** | React 19.2.0 | UI framework |
| **Build Tool** | Vite 7.3.1 | Fast dev/build setup |
| **Charts** | Recharts 3.8.0 | Data visualization |
| **Icons** | lucide-react 0.577 | UI icons |
| **Styling** | CSS3 | Custom styling (glassmorphism) |
| **DOM API** | React DOM 19.2.0 | React rendering |

### Deployment
| Component | Platform | Configuration |
|-----------|----------|----------------|
| **Frontend** | Vercel | Auto-deploy from GitHub |
| **Backend** | Railway | Docker containers + GitHub auto-deploy |
| **Database** | MongoDB Atlas | Cloud-hosted MongoDB |
| **Email API** | Brevo | SMTP replacement via HTTP |

---

## ✨ Features

### Core Features
- ✅ **Dual App Store Support**: Scrapes reviews from both Google Play and Apple App Store
- ✅ **AI-Powered Analysis**: Uses Groq's LLaMA 3.1 8B model for intelligent insights
- ✅ **Automated Scheduling**: Runs daily at 2:00 AM via cron (configurable)
- ✅ **Email Delivery**: Sends formatted HTML reports via Brevo API
- ✅ **Real-time Dashboard**: React-based UI with live data updates
- ✅ **Job Tracking**: Monitors analysis job status and progress
- ✅ **Urgent Themes**: Auto-identifies high-priority issues from reviews
- ✅ **MongoDB Persistence**: Stores historical data for trend analysis
- ✅ **User Voice Quotes**: Includes actual review quotes in reports
- ✅ **Actionable Recommendations**: Generates strategic action items

### Dashboard Features
- 📊 Review volume trends (8-week chart)
- 📈 Sentiment score tracking
- ⚠️ Urgent themes requiring immediate action
- 💬 Raw user voice (actual quotes)
- 🚀 Strategic action recommendations
- 🔄 Top 5 emerging themes
- ⏱️ Last generated timestamp
- 📧 Email trigger with custom recipient

---

## 📁 Project Structure

```
AgentBuilder/
├── 📄 package.json                 # Backend dependencies
├── 📄 server.js                    # Express server & API routes
├── 📄 architecture.md              # System design documentation
├── 📄 README.md                    # This file
│
├── 📁 dashboard/                   # React Frontend (Vercel)
│   ├── 📄 package.json
│   ├── 📄 vite.config.js
│   ├── 📄 index.html
│   ├── 📁 src/
│   │   ├── main.jsx                # React entry point
│   │   ├── App.jsx                 # Main app component
│   │   ├── index.css               # Global styles
│   │   ├── 📁 components/
│   │   │   └── ComprehensiveDashboard.jsx  # Dashboard UI
│   │   └── 📁 data/
│   │       ├── pulse.json          # Default pulse data
│   │       └── pulse_history.json  # Historical data
│   └── 📁 dist/                    # Built files (production)
│
├── 📁 services/                    # Business logic
│   ├── reviewFetcher.js            # Scrapes app store reviews
│   ├── llmAnalyzer.js              # Map-Reduce LLM analysis
│   ├── emailService.js             # Email delivery via Brevo
│   ├── jobTracker.js               # Job status management
│   ├── PulseModel.js               # MongoDB schema
│   └── jobStore.js                 # In-memory job storage
│
└── 📁 utils/
    └── sanitizer.js                # Text sanitization utilities
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account
- Groq API key (free tier available)
- Brevo email account with API key
- Git

### Local Development

1. **Clone Repository**
```bash
git clone https://github.com/a-poorv/GrowwWeeklyPulseAgent.git
cd GrowwWeeklyPulseAgent
```

2. **Install Backend Dependencies**
```bash
npm install
```

3. **Install Frontend Dependencies**
```bash
cd dashboard
npm install
cd ..
```

4. **Create Environment File**
```bash
cp .env.example .env
# Edit .env with your credentials
```

5. **Run Backend**
```bash
npm start
# Server running on http://localhost:3000
```

6. **Run Frontend (in another terminal)**
```bash
cd dashboard
npm run dev
# Dashboard on http://localhost:5173
```

---

## 🔑 Environment Variables

### Backend (.env)
```env
# API Keys
GROQ_API_KEY=xxxxxxxxxxx                    # Get from https://console.groq.com
BREVO_API_KEY=xxxxxxxxxxx                   # Get from https://app.brevo.com/settings/account/api
RESEND_API_KEY=xxxxxxxxxxx                  # Optional: Alternative email service

# Email Configuration
SMTP_USER=your-email@gmail.com               # Brevo account email
SMTP_PASS=xxxxxxxxxxxxxxxx                   # 16-char Gmail App Password
TARGET_EMAIL=recipient@example.com           # Where to send reports

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/pulse_db?retryWrites=true&w=majority

# Server
PORT=3000
NODE_ENV=development

# App Configuration (Groww)
GROWW_PLAY_STORE_PKG=com.nextbillion.groww
GROWW_APP_STORE_ID=1404142692
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000          # Backend URL
```

---

## 📡 API Endpoints

### Generate Pulse Report
```http
POST /api/generate-pulse
Content-Type: application/json

{
  "weeks": 8,
  "recipientEmail": "example@email.com"
}

Response: {
  "jobId": "uuid-string",
  "status": "queued|processing|completed",
  "progress": 0-100
}
```

### Get Pulse Report
```http
GET /api/pulse?weeks=8

Response: {
  "themes": ["Theme 1", "Theme 2", ...],
  "quotes": ["Quote 1", "Quote 2", ...],
  "actions": ["Action 1", "Action 2", ...],
  "urgentThemes": [
    {
      "name": "Theme Name",
      "action": "Action description",
      "urgency": "CRITICAL|HIGH|MEDIUM",
      "change": "+X%"
    }
  ],
  "totalReviews": 678,
  "reviewChange": "+10%",
  "sentimentScore": 7.5,
  "sentimentChange": 1.2,
  "generatedAt": "2026-03-15T10:30:00Z"
}
```

### Monitor Job Status
```http
GET /api/jobs/:jobId

Response: {
  "jobId": "uuid",
  "status": "processing",
  "phase": "mapping|reducing|email",
  "progress": 45,
  "startedAt": "2026-03-15T10:30:00Z"
}
```

### List All Jobs
```http
GET /api/jobs

Response: [
  { jobId: "uuid1", status: "completed", progress: 100 },
  { jobId: "uuid2", status: "processing", progress: 65 }
]
```

### Trigger Scheduler Manually
```http
POST /api/trigger-cron-now

Response: {
  "status": "triggered",
  "jobId": "uuid-string"
}
```

---

## 🗄️ Database Schema

### MongoDB Collections

**Pulse Collection** (pulse_db)
```javascript
{
  _id: ObjectId,
  weeks: Number,                    // 1-8 weeks of data
  generatedAt: String,              // ISO timestamp
  totalReviews: Number,
  reviewChange: String,             // "+10%" format
  sentimentScore: Number,           // 1-10 scale
  sentimentChange: Number,
  themes: Array,                    // Top 5 emerging themes
  quotes: Array,                    // 3 representative quotes
  actions: Array,                   // Strategic recommendations
  urgentThemes: [                   // Top 3 urgent
    {
      name: String,
      action: String,
      urgency: String,              // CRITICAL|HIGH|MEDIUM
      change: String                // "+X%" format
    }
  ],
  createdAt: Date,                  // Auto-generated
  updatedAt: Date                   // Auto-generated
}
```

**Index Strategy**
```javascript
db.pulses.createIndex({ weeks: 1 }, { unique: true })
db.pulses.createIndex({ generatedAt: -1 })
```

---

## 🧠 Key Implementations

### 1. Map-Reduce LLM Analysis

**Why Map-Reduce?**
- Reviews can be 100-1000+ entries
- Groq free tier has rate limits (~30 reviews/batch)
- Chunking prevents timeout and respects API limits

**How It Works:**
```
Input: 678 reviews (8 weeks)
    ↓
Chunk into 23 batches of 30 reviews each
    ↓
MAP PHASE (Sequential to respect rate limits):
  Batch 1 → Groq LLaMA → Extract: themes, sentiment, quotes
  Batch 2 → Groq LLaMA → Extract: themes, sentiment, quotes
  ... (repeat 23 times)
    ↓
REDUCE PHASE:
  Combine 23 micro-analyses
  → Identify top 5 themes
  → Calculate aggregate sentiment
  → Select best 3 quotes
  → Generate final recommendations
    ↓
Output: Structured pulse report
```

**Rate Limiting Strategy:**
- Sequential batch processing (not parallel)
- 3-second delay between batches
- Retry with exponential backoff on failure
- Max 3 retry attempts per batch

### 2. Email Delivery via Brevo

**Why Brevo Instead of SMTP?**
- SMTP can get blocked by corporate firewalls
- Brevo HTTP API (v3) is more reliable
- Built-in rate limiting and bounce tracking
- Better deliverability tracking

**Email Flow:**
```
Dashboard → "Generate Pulse" Button
    ↓
API Request → /api/generate-pulse (with email)
    ↓
Backend Initiates Job:
  ├─ Fetch Reviews → Scraper
  ├─ Analyze → LLM (Map-Reduce)
  ├─ Format HTML → Email Template
  └─ Send → Brevo HTTP API
    ↓
Brevo Sends Email (max 1.5kb HTML)
    ↓
Report in Recipient Inbox ✅
```

**Email Template Structure:**
```html
Header (Branding)
  ↓
Key Metrics (3-column grid)
  ├─ Total Reviews (678)
  ├─ Avg Sentiment (7.5)
  └─ Status (Healthy)
  ↓
Urgent Themes (if any)
  └─ Top 3 by mention count
  ↓
Top Themes (5 emerging themes)
  ↓
Raw User Voice (3 direct quotes)
  ↓
Strategic Actions (3 recommendations)
  ↓
Footer (Timestamp & Source)
```

### 3. Scheduler & Job Tracking

**Cron Schedule:**
```bash
0 2 * * *    # Every day at 2:00 AM
# Format: minute hour day month dayOfWeek
```

**Job Lifecycle:**
```
queued → initializing → fetching_reviews → analyzing_reviews 
  → generating_report → sending_email → completed|failed
```

**Job Tracker (In-Memory)**
```javascript
{
  jobId: {
    status: "processing",
    phase: "mapping",
    progress: 45,
    startedAt: Date,
    endedAt: null,
    error: null
  }
}
```

**Auto-Cleanup:** Jobs older than 24 hours are purged daily

### 4. Urgent Theme Auto-Generation

**Logic:**
```javascript
1. Get all themes from API/fallback
2. Sort by mention count (highest first)
3. Select top 3 themes
4. Assign urgency levels:
   - Position 1 → CRITICAL (most mentioned)
   - Position 2 → HIGH (second most)
   - Position 3 → MEDIUM (third most)
5. If urgentThemes missing → Auto-generate above
6. If available → Use provided urgentThemes
```

### 5. MongoDB Caching Strategy

**Read Pattern:**
```
Dashboard Load
  ↓
Check MongoDB for cached pulse data
  ├─→ If found & fresh (< 24h) → Use cache
  └─→ If not found → Use fallback data
  ↓
Display on Dashboard
```

**Write Pattern:**
```
Generate Job Completes
  ↓
Save results to MongoDB (upsert by week)
  ↓
Clear cache for that week
  ↓
Dashboard refreshes automatically
```

**Performance Benefits:**
- Reduces Groq API calls
- Dashboard loads instantly
- Reduces computation load
- Historical data preserved

---

## 🌐 Deployment

### Frontend Deployment (Vercel)

**Prerequisites:**
- Vercel account (free)
- GitHub repository connected

**Steps:**
1. Push code to GitHub: `git push origin main`
2. Go to https://vercel.com/dashboard
3. Click "Add New" → "Project"
4. Select your GitHub repository
5. Configure:
   - **Root Directory**: `dashboard`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add Environment: `VITE_API_URL=https://your-railway-backend.up.railway.app`
7. Click Deploy

**Auto-Redeployment:**
- Push to GitHub main branch
- Vercel automatically rebuilds & deploys
- Typically takes 1-2 minutes

### Backend Deployment (Railway)

**Prerequisites:**
- Railway account (free tier, $5/month paid)
- GitHub repository connected
- MongoDB Atlas (free tier available)
- Brevo API key

**Steps:**
1. Go to https://railway.app/dashboard
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Configure:
   - **Root**: `/` (root directory)
   - **Build**: `npm install`
   - **Start**: `npm start`
5. Add Environment Variables:
   ```
   GROQ_API_KEY=xxxx
   BREVO_API_KEY=xxxx
   MONGODB_URI=mongodb+srv://...
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=16-char-app-password
   TARGET_EMAIL=recipient@email.com
   NODE_ENV=production
   PORT=3000
   ```
6. Click Deploy

**Auto-Redeployment:**
- Push to GitHub main branch
- Railway auto-redeploys within 2-5 minutes
- View logs: Railway Dashboard → Logs tab

**Monitoring:**
- Railway Dashboard → Metrics
- CPU, Memory, Network usage
- Error logs in real-time

---

## 🔄 Workflow Example

### Complete User Journey

```
1. User opens dashboard: http://groww-pulse.vercel.app

2. Dashboard loads:
   ├─ Fetches /api/pulse?weeks=8
   ├─ Displays latest pulse data
   └─ Shows "Last Generated: 3/14/2026, 2:10 AM"

3. User selects weeks (4W) and email (user@gmail.com)

4. User clicks "Generate Pulse":
   ├─ POST /api/generate-pulse { weeks: 4, recipientEmail: "user@gmail.com" }
   ├─ Backend creates job (job123)
   └─ Returns jobId for polling

5. Dashboard polls every 2 seconds: GET /api/jobs/job123
   ├─ Shows progress: fetching → analyzing → generating → sending
   └─ Updates progress bar: 0% → 100%

6. Backend processes:
   ├─ Fetches 450 reviews (4 weeks)
   ├─ Chunks into 15 batches
   ├─ Analyzes with Groq LLaMA (map phase)
   ├─ Reduces insights (reduce phase)
   ├─ Stores in MongoDB
   └─ Sends via Brevo API

7. Email arrives in user@gmail.com inbox:
   ├─ Subject: "📈 Groww Weekly Pulse Report - 3/15/2026"
   ├─ Contains: Metrics, Urgent Themes, Quotes, Actions
   └─ Professional HTML format

8. Dashboard shows: "✅ Report generated successfully!"
   └─ User can generate another or change parameters
```

---

## 📊 Performance Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Dashboard load | < 2s | ~1.2s |
| Pulse generation (8W) | < 5m | ~4.5m |
| Email delivery | < 30s | ~5-10s |
| API response | < 500ms | ~200-300ms |
| Database query | < 100ms | ~50-80ms |
| LLM analysis batch | < 10s | ~8-9s |

---

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```
❌ MongoDB connection error: connect ECONNREFUSED
✅ Solution: Check MONGODB_URI in .env, ensure MongoDB Atlas cluster is running
```

**Groq API Rate Limit**
```
❌ 429 Too Many Requests
✅ Solution: Batch size reduced to 30 reviews, sequential processing enabled
```

**Email Not Sending**
```
❌ BREVO_API_KEY is missing or invalid
✅ Solution: Get fresh API key from https://app.brevo.com/settings/account/api
```

**Dashboard Not Updating**
```
❌ VITE_API_URL pointing to wrong backend
✅ Solution: Check .env in dashboard folder, ensure backend URL is correct
```

---

## 📚 References

- [Express Documentation](https://expressjs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Groq Console](https://console.groq.com)
- [Brevo API Docs](https://developers.brevo.com/reference/sendtransacemail)
- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)

---

## 📝 License

MIT License - See LICENSE file for details

---

## 👨‍💻 Author

**Developed by**: Apoorv Sri

**Repository**: [GrowwWeeklyPulseAgent](https://github.com/a-poorv/GrowwWeeklyPulseAgent)

**Support**: For issues or suggestions, open a GitHub issue or contact the maintainer

---

## 🎓 Learning Resources

This project demonstrates:
- ✅ Full-stack JavaScript development
- ✅ Map-Reduce pattern for large data processing
- ✅ Integration with multiple APIs (Groq, Brevo, App Stores)
- ✅ Cron job scheduling in Node.js
- ✅ MongoDB data modeling and querying
- ✅ React state management and hooks
- ✅ CI/CD with GitHub, Vercel, and Railway
- ✅ Email service integration
- ✅ Real-time job tracking and progress monitoring

---

**Last Updated**: March 15, 2026  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
