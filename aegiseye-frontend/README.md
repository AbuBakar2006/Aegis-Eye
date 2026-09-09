# AegisEye Frontend

> Production-quality React + TypeScript dashboard for the **AegisEye** AI-powered accident detection system.

---

## 🚀 Quick Start

### Prerequisites
Install [Node.js 18+](https://nodejs.org/) if you haven't already.

### 1. Install dependencies
```bash
cd aegiseye-frontend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env and set your backend URL:
# VITE_API_BASE_URL=http://localhost:8000
```

### 3. Run the dev server
```bash
npm run dev
```

Open http://localhost:5173 — the dashboard opens directly (no login page).

---

## ⚙️ Architecture

```
EXISTING BACKEND (FastAPI — not modified)
          ↓
    REST API Layer
          ↓
  src/api/  (service abstraction layer)
          ↓
  React Components / Pages
          ↓
    Browser Dashboard
```

### API Layer (`src/api/`)
All backend communication is isolated here. Never put `fetch()` calls inside components.

| File | Purpose |
|------|---------|
| `client.ts` | Base fetch client, reads `VITE_API_BASE_URL` |
| `incidents.ts` | `GET /api/incidents`, `/clip`, `/report` |
| `cameras.ts` | **MOCK** until backend exposes `/api/cameras` |

### Backend Endpoints Used
| Method | Endpoint | Status |
|--------|----------|--------|
| GET | `/api/incidents` | ✅ Live |
| GET | `/api/incidents/{id}/clip` | ✅ Live |
| GET | `/api/incidents/{id}/report` | ✅ Live |
| GET | `/api/cameras` | 🟡 Mock — replace in `api/cameras.ts` |

---

## 🎭 Demo Mode

Enabled by default. Shows rich simulated data so the FYP team can present without a running backend.

- Toggle in **Settings** page or banner
- Shows animated accident detection simulation on Live Cameras page
- All mock data is in `src/data/` — clearly labelled

---

## 📁 Project Structure

```
src/
├── api/            ← Backend service layer (isolated)
├── types/          ← TypeScript interfaces
├── hooks/          ← React Query hooks (useIncidents, useCameras)
├── data/           ← Mock/demo data
├── store/          ← Zustand global state
├── layouts/        ← DashboardLayout shell
├── components/
│   ├── incidents/  ← IncidentCard, IncidentTable, SeverityBadge
│   ├── cameras/    ← CameraFeed, CameraGrid
│   ├── analytics/  ← Charts (Recharts)
│   ├── demo/       ← Demo mode banner
│   └── shared/     ← Loading, Error, Empty states
├── pages/
│   ├── Dashboard.tsx
│   ├── LiveCameras.tsx
│   ├── Incidents.tsx
│   ├── IncidentDetail.tsx
│   ├── Analytics.tsx
│   └── Settings.tsx
└── utils/
    ├── format.ts   ← Date, GPS, confidence formatters
    └── cn.ts       ← Tailwind merge
```

---

## 🔌 Connecting to the Backend

1. Set `VITE_API_BASE_URL` in `.env` to your FastAPI server URL
2. Disable Demo Mode in Settings
3. The frontend will hit `/api/incidents` and related endpoints

### Camera Streams
When backend exposes camera stream URLs:
- **MJPEG**: Set `streamUrl` and `streamFormat: 'mjpeg'` — rendered as `<img src=...>`  
- **HLS/WebRTC**: Set `streamFormat: 'hls'` — rendered as `<video src=...>`

---

## 🏗️ Build for Production

```bash
npm run build
# Output in dist/
```

---

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** — dark-themed utility classes
- **Framer Motion** — animations and transitions
- **TanStack Query** — data fetching with loading/error states
- **Recharts** — analytics charts
- **Zustand** — lightweight global state
- **React Router v6** — client-side routing
- **Lucide React** — icons

---

> **Note**: This is the **frontend only**. The backend (FastAPI, YOLO11m models, OpenCV, PDF generation, alerts) is developed and maintained separately. Do not modify backend files.
