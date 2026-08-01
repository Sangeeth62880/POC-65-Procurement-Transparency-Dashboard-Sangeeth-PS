# Procurement Transparency Dashboard

An interactive, high-fidelity visualization platform engineered to map and audit public federal procurement obligations in real time. The system acts as a transparent lens into the largest capital-allocation rail of the United States government, pulling data directly from live public registries and aggregating insights by jurisdiction, awarding agency, and vendor concentration.

Designed and developed under the strict visual specifications of the **Real Rails** dashboard system, this platform enforces a fixed 70/30 split viewport to guarantee visual consistency and focus.

---

## 🏗️ System Architecture

The application is structured as a decoupled monorepo:

### 1. Backend Service (`/backend`)
A high-performance Python microservice developed with **FastAPI** that acts as an optimized data aggregator and API proxy to the public `USAspending.gov` v2 endpoints.
* **Response Cache**: Integrates a 1-hour in-memory cache to prevent upstream API bottlenecks and guarantee fast client load times.
* **Unified Fail-Safes**: Implements graceful fallback models returning clean default JSON payloads to prevent frontend application crashes under rate-limiting or service outages.
* **Relational Mapping**: Translates raw federal response lists into unified objects including state centroids, per-capita metrics, and agency indicators.
* **CSV Export Pipeline**: Serves dynamically generated CSV streams for up to 500 records mapped dynamically to client filter options.

### 2. Frontend client (`/frontend`)
A responsive **Next.js 16 (App Router)** single-page web portal styled completely manually with Tailwind CSS v4.
* **Visual Canvas (`MapLibre GL`)**: Projects geographic obligation vectors using map canvas rendering to avoid DOM hit-testing overhead. Circles scale dynamically (6px to 24px) based on obligation concentration.
* **Intelligence Sidebar (`TanStack Table`)**: Occupies exactly 30% width, displaying a tabular view of top vendor allocations, aggregate metric widgets, contextual guides, and details pane for clicked map coordinates.
* **Adaptive Tooltips**: Binds mouse track canvas coordinates with absolute offset calculations (+12px right, -40px up) to ensure flicker-free tooltip transitions.

---

## 🎨 Visual Identity & Styling DNA

The user interface follows strict design commitments to deliver a clean dashboard theme:
* **Background Canvas**: `#030712` (pure dark)
* **Card/Surface Panels**: `#0B1117` (deep dark surface)
* **Borders/Lines**: `#1F2937` (thin structural borders)
* **Primary Accent Color**: `#38BDF8` (Cyan highlight for active elements)
* **Secondary Accent Color**: `#818CF8` (Indigo accent for markers)
* **Typography**: Sans-serif metrics leveraging Geist Sans or system Inter fonts.
* **Controls & Radii**: Hardcapped to `6px` (`rounded-md`) with custom narrow webkit scrollbars.

---

## 🔌 API Documentation

The backend service runs by default on `http://localhost:8000` and exposes:

* **`GET /api/health`**: Diagnostic endpoints returning system health status.
* **`GET /api/agencies`**: Lists all toptier federal awarding agencies alphabetically for filter selectors.
* **`GET /api/states`**: Aggregates state-by-state procurement obligations, populations, lat/lng centroids, and per-capita values.
* **`GET /api/vendors`**: Aggregates top 20 vendors by obligation values.
* **`GET /api/awards`**: Fetches paginated detail awards for map coordinate drilldowns.
* **`GET /api/awards/csv`**: Generates and downloads a unified CSV spreadsheet based on active filters.

---

## 🚀 Installation & Local Startup

Follow these steps to run the application locally:

### 1. Start the Backend API Service

Navigate to the backend directory, configure the environment, and spin up the server:

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the uvicorn development server
uvicorn main:app --reload --port 8000
```

### 2. Start the Frontend Client

Navigate to the frontend directory, install npm packages, and start the Next.js dev server:

```bash
cd ../frontend

# Install node dependencies
npm install

# Start development client
npm run dev
```

* Open your browser and navigate to `http://localhost:3000` to view the dashboard.

---

## 🚀 Deployment

### Backend — Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select this repository
3. Set root directory to: `backend`
4. Add environment variable:
   `CORS_ORIGINS=https://your-vercel-app.vercel.app`
5. Go to Settings → Networking → Generate Domain
6. Copy your Railway backend URL

### Frontend — Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select this repository
3. Set root directory to: `frontend`
4. Add environment variable:
   `NEXT_PUBLIC_API_BASE_URL=https://your-backend.railway.app`
5. Click Deploy

### After deployment

Update Railway `CORS_ORIGINS` to match your actual Vercel frontend URL.

---

## 🐳 Docker Compose

Run both services locally with Docker:

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

---

## 💻 Local Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
