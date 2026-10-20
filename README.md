# 🌟 AniCart — Ultimate Anime Intelligence & Watchlist Platform

> **AniCart** is a modern, high-performance anime tracking, streaming schedule, editorial news, and AI intelligence platform built with a dark cyberpunk **Liquid Glass UI**, **Live Indian Standard Time (IST) Airing Schedules**, **Interactive Watchlist Management**, and **AniChat 🍙** — an advanced anime AI assistant powered by **Google Gemini**.

---

## ✨ Key Features

### 1. 📰 Premium Anime News & Editorial Reading Experience
- **In-App Full Article Reading**: Read full industry news, announcements, and reviews directly on AniCart without being redirected.
- **Rich Content Pipeline**: Parses and renders headings, blockquotes, code blocks, lists, and GitHub-Flavored Markdown tables with responsive horizontal scrolling.
- **Article Metadata & Citations**: Real-time source attribution, author bylines, publication dates, and original publisher verification links.
- **Responsive Layout**: Comfortable reading typography, hero banners, dark navy/midnight glass theme, and mobile-friendly layouts.

### 2. 📋 Interactive Watchlist Management
- **Categorized Lists**: Organize anime into *Watching*, *Plan to Watch*, and *Completed (Watched)*.
- **Custom Ratings & Notes**: Add personal scores, progress notes, and episode tracking.
- **Dual Database Architecture**: Connects to **MongoDB** with zero-configuration fallback to an integrated local persistent JSON database (`server/data/db.json`).

### 3. 📤 Share & Download Watched Anime List
- **Public Showcase Link**: Generate a shareable public link (`/?sharedWatched=:userId`) allowing friends and social followers to view your completed anime list without logging in.
- **Social / Discord / WhatsApp Export**: 1-click formatted Markdown summary with total watched counts, average ratings, and top-rated anime picks.
- **Multi-Format Downloads**:
  - **Spreadsheet / CSV (`.csv`)**: Pre-formatted with a UTF-8 BOM (`\uFEFF`) for perfect display of Japanese/accented characters in Microsoft Excel, Google Sheets, and Notion.
  - **Full JSON Backup (`.json`)**: Complete structured database backup of your watchlist items.
  - **Formatted Text (`.txt`)**: Clean, human-readable summary document.

### 4. 🍙 AniChat AI Chatbot (Google Gemini Powered)
- **Deep Anime Lore & Recaps**: Character backstories, episode guides, plot summaries, and spoiler-safe explanations.
- **Live Airing Guidance**: Real-time Japanese broadcast schedules converted to Indian Standard Time (IST).
- **Interactive Poster Cards**: Converts AI recommendations into visual cards with IMDb ratings and 1-click watchlist add buttons.

### 5. 🕒 Live Indian Standard Time (IST UTC+5:30) Airing Schedules
- **Day-by-Day Broadcast Schedule**: Monday through Sunday broadcast times accurately converted to IST.
- **Live Countdowns**: Real-time dynamic badges showing exact time until the next episode (`In X hours, Y mins`).
- **2026 Seasonal Showcase**: View anime by Japanese broadcast seasons (Spring, Summer, Fall, Winter) or the All-Seasons split view.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Canvas Confetti, Marked, DOMPurify.
- **Backend**: Node.js, Express 4, Axios, Mongoose, JSONWebToken, Dotenv.
- **Storage**: MongoDB with automatic fallback to persistent local JSON storage (`server/data/db.json`).
- **AI Engine**: Google Gemini API (`@google/genai` SDK).
- **Anime Metadata**: AniList GraphQL API, Jikan REST API (MyAnimeList), Anime News Network RSS feeds.

---

## 📁 Repository Structure

```
anime-watchlist/
├── client/                     # Vite + React Frontend
│   ├── public/                 # Static assets & icons
│   ├── src/
│   │   ├── components/         # LiquidGlassNavbar, AiringScheduleIST, AniChatBot, etc.
│   │   ├── context/            # AuthContext (Google Sign-in, User Watchlist state)
│   │   ├── services/           # api.js (API client with configurable BASE_URL)
│   │   ├── App.jsx             # Main router & layout tabs
│   │   ├── main.jsx            # React root entrypoint
│   │   └── index.css           # Tailwind + Custom Liquid Glass styling
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
│
├── server/                     # Node.js + Express Backend
│   ├── config/                 # Database configuration & JSON fallback engine
│   ├── data/                   # db.json (persistent local database storage)
│   ├── models/                 # User & WatchlistItem schemas
│   ├── routes/                 # anime.js, auth.js, chat.js, news.js, watchlist.js
│   ├── services/               # syncService.js (Automated daily sync engine)
│   ├── server.js               # Express application entrypoint
│   ├── package.json
│   └── .env.example            # Environment variables template
│
├── .gitignore                  # Git ignore rules for node_modules, build, and secrets
├── package.json                # Root package with monorepo scripts
└── README.md                   # Project documentation
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js** v18+ installed on your computer.
- **npm** (comes bundled with Node.js).

### 2. Installation
Clone or extract the repository, then install dependencies for both client and server:

```bash
# Install all dependencies with root helper:
npm run install:all
```

Or install separately:
```bash
cd server
npm install

cd ../client
npm install
```

### 3. Environment Variables
Copy the example environment files:

```bash
# In the server directory:
cp server/.env.example server/.env
```

Edit `server/.env` with your preferred configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/anime_watchlist
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_google_gemini_api_key_here
```
*(Note: If MongoDB is not running locally, the server automatically saves data to `server/data/db.json` with zero extra configuration required).*

### 4. Running the Development Servers
Open two terminal windows:

**Terminal 1 — Backend API:**
```bash
cd server
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 — Frontend Client:**
```bash
cd client
npm run dev
# Running on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser!

---

## 🐙 Pushing to GitHub

Follow these steps to host your project on GitHub:

### 1. Initialize Git & Commit
Open a terminal in the project root directory:

```bash
git init
git add .
git commit -m "Initial commit: AniCart & AniChat fullstack platform"
```

### 2. Create a GitHub Repository
1. Go to [GitHub.com](https://github.com/new) and click **New Repository**.
2. Name it (e.g., `anicart-platform`).
3. Leave "Initialize this repository with a README" **unchecked** (we already have one).
4. Click **Create repository**.

### 3. Link and Push
Run the commands shown on GitHub:

```bash
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

---

## 🌐 Deployment & Hosting Guide

### Option A: Frontend on Vercel & Backend on Render (Recommended & Free)

#### 1. Backend (Render.com)
1. Go to [Render.com](https://render.com) and create a free **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add Environment Variables in Render:
   - `PORT`: `5000`
   - `JWT_SECRET`: (your secure secret string)
   - `GEMINI_API_KEY`: (your Google Gemini API key)
   - `MONGODB_URI`: (optional MongoDB Atlas URI, or Render persistent disk)
5. Click **Deploy**. Note your backend URL (e.g., `https://anicart-api.onrender.com`).

#### 2. Frontend (Vercel.com)
1. Go to [Vercel.com](https://vercel.com) and import your GitHub repository.
2. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variable in Vercel:
   - `VITE_API_URL`: `https://anicart-api.onrender.com/api` (your Render backend URL + `/api`)
4. Click **Deploy**. Your site will be live on `https://your-project.vercel.app`!

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
