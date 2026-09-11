# RescueNet AI — Real-Time Disaster Command Center GIS Platform

An Emergency Operations Center (EOC) platform featuring 3D terrain hydrology GIS mapping, multi-hazard cascade tracking (Cyclone Shakti -> Extreme Rainfall -> River Surge -> Landslide Instability), pre-impact lead-time evacuation priority ranking, certified relief capacity headroom tracking, and an AI Decision Assistant.

---

## 🛠️ Project Structure

```
raksha/
├── .vscode/                 # Preconfigured tasks, settings & launch.json for VS Code / Cursor
├── backend/                 # FastAPI REST API, GeoJSON generators & AI Copilot
│   ├── main.py              # Application entrypoint & REST routes
│   ├── ai_copilot.py        # Decision Assistant engine
│   ├── cyclone_engine.py    # Multi-hazard timeline model
│   ├── database.py          # Wayanad geographic databases & relief centers
│   ├── requirements.txt     # Python dependencies
│   └── ...
├── frontend/                # React 18 + Vite + TypeScript + Tailwind CSS + MapLibre GL
│   ├── public/              # MapLibre Web Worker & static assets
│   │   └── maplibre-gl-worker.mjs
│   ├── src/                 # Application source code
│   │   ├── components/      # RealGISDisasterMap, CommandCenter, KPICards, etc.
│   │   ├── data/            # wayanadGISData.ts (6-step timeline & GeoJSON layers)
│   │   ├── types/           # Core TypeScript definitions
│   │   ├── App.tsx          # Master state & reactive telemetry synchronization
│   │   └── main.tsx         # React root with ErrorBoundary
│   ├── package.json         # Node.js dependencies
│   ├── vite.config.ts       # Vite bundler configuration
│   └── tsconfig.json        # TypeScript configuration
├── start_dev.bat            # Windows 1-click launcher
├── start_dev.sh             # Linux / macOS 1-click launcher
└── README.md                # Project documentation
```

---

## 🚀 Quick Start in ANY IDE (VS Code, Cursor, WebStorm, PyCharm)

### Prerequisites
- **Node.js**: v18.0.0 or later
- **Python**: v3.9 or later

### Method 1: One-Click Startup (Windows)
Double-click `start_dev.bat` in the root folder.
This opens both the FastAPI backend on port `8010` and Vite frontend on port `5173`.

### Method 2: Command Line (Step-by-Step)

#### 1. Start Backend:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8010 --reload
```
*API docs available at: http://127.0.0.1:8010/docs*

#### 2. Start Frontend:
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Dashboard available at: http://localhost:5173*

---

## 💻 IDE Setup Guides

### Visual Studio Code / Cursor
1. Open the project root folder: `File -> Open Folder... -> raksha`.
2. Press `Ctrl + Shift + B` (or `Cmd + Shift + B` on Mac) and choose `Start Frontend (Vite)` or `Start Backend (FastAPI)`.
3. Or press `F5` to start debugging with the preconfigured `.vscode/launch.json`.

### JetBrains WebStorm / PyCharm
1. Open the root folder `raksha`.
2. Configure **Node.js Run Configuration**:
   - Working Directory: `frontend`
   - Package manager script: `npm run dev`
3. Configure **Python Run Configuration**:
   - Working Directory: `backend`
   - Module name: `uvicorn`
   - Parameters: `main:app --host 127.0.0.1 --port 8010 --reload`

---

## 🎯 Key Capabilities
1. **3D Real GIS Terrain Visualization**: Real Wayanad DEM topography with MapLibre GL 3D exaggeration, river particle simulations, and road networks.
2. **Predictive 48-Hour Multi-Hazard Cascade**: Scrub through T0 -> T+48h simulating cyclone approach, rainfall surges, and bridge cutoff.
3. **Synchronized Operational Telemetry**: Single source of truth linking Blocked Roads, Evacuation Priorities, and Relief Bed Headroom (7,160 capacity).
4. **AI Decision Assistant**: Live operational queries with situational directives and evacuation route diversions.
