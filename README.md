# Automated AI Newsroom

A local, full-stack intelligence platform that autonomously researches, processes, and serves AI industry briefs[cite: 7]. This project utilizes the ChatGPT desktop app as a headless data engine, bridging local AI generation with a persistent SQLite database and a modern React frontend[cite: 7].

## Features
* **Headless AI Ingestion:** Uses a local sync directory to capture structured JSON research briefs generated autonomously by ChatGPT[cite: 7].
* **Race-Condition Buffer:** Implements a time-delay buffer (e.g., 90 seconds) to ensure AI read/write operations complete safely before database ingestion[cite: 7].
* **Rich Editorial Taxonomy:** Supports advanced schema definitions including Categories, News Types, Key Takeaways, and Verified Primary Citations[cite: 7].
* **Modern React UI:** A responsive, modular frontend built with React and Tailwind, featuring dynamic client-side filtering, bookmarking, and slide-out deep-dive drawers[cite: 7].
* **Single-Server Deployment:** The React frontend is compiled and served statically directly through the FastAPI backend for a unified, single-port application.
* **Live Polling:** The client continuously polls the backend API (every 5 seconds) and displays non-disruptive update banners when new intelligence arrives[cite: 7].

## Architecture
* **AI Generation:** ChatGPT Desktop App (Scheduled Tasks & Skills)[cite: 7]
* **Frontend:** React (TypeScript), Vite, Tailwind CSS (Compiled to static assets)[cite: 7]
* **Backend:** FastAPI (Python) serving both the REST API and the static React files[cite: 7]
* **Database:** SQLAlchemy, SQLite (`newsroom.db`)[cite: 7]
* **Data Transfer:** JSON File-System Bridge → REST API (GET `/api/news`)[cite: 7]

---

## Getting Started

### 1. Prerequisites
* **Python 3.8+** (for the FastAPI backend)[cite: 7]
* **Node.js 18+** (for compiling the React frontend)[cite: 7]
* **ChatGPT Desktop App** (Mac/Windows with Workspace write permissions enabled)[cite: 7]

### 2. Build the Frontend
Because the application is bundled, you must first compile the React UI into static files.

1. Navigate to the `/frontend` directory[cite: 7].
2. Install the Node dependencies:
   `npm install`[cite: 7]
3. Build the production application:
   `npm run build`
4. Copy or move the newly generated `dist` folder into your `/backend` directory so it sits right next to `main.py`.

### 3. Run the Unified Backend
The backend handles folder monitoring, data parsing, database persistence, and serving the web interface[cite: 7].

1. Navigate to the `/backend` directory[cite: 7].
2. Install the required Python packages:
   `pip install fastapi uvicorn sqlalchemy pydantic`[cite: 7]
3. Open `main.py` and update the `SYNC_FOLDER` variable to point to the directory where ChatGPT will save its JSON files[cite: 7].
4. Start the server:
   `python main.py`[cite: 7]

*The server will run on `http://127.0.0.1:8000`. Visiting this URL in your browser will load the full React web interface, and the API will automatically generate `newsroom.db` in the script's directory.*[cite: 7]

## Repository Structure
* `/backend`[cite: 7]
  * `main.py` - FastAPI server, SQLite configuration, static file routing, and ingestion logic[cite: 7].
  * `/dist` - The compiled React frontend (generated in step 2).
* `/frontend`[cite: 7]
  * `src/App.tsx` - Main React application, state management, and polling logic[cite: 7].
  * `src/types.ts` - TypeScript interfaces for the Article data model[cite: 7].
