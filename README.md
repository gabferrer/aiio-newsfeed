# Automated AI Newsroom

A local, full-stack intelligence platform that autonomously researches, processes, and serves AI industry briefs. This project utilizes the ChatGPT desktop app as a headless data engine, bridging local AI generation with a persistent SQLite database and a modern React frontend.

## Features
* **Headless AI Ingestion:** Uses a local sync directory to capture structured JSON research briefs generated autonomously by ChatGPT.
* **Race-Condition Buffer:** Implements a time-delay buffer (e.g., 90 seconds) to ensure AI read/write operations complete safely before database ingestion.
* **Rich Editorial Taxonomy:** Supports advanced schema definitions including Categories, News Types, Key Takeaways, and Verified Primary Citations.
* **Modern React UI:** A responsive, modular frontend built with React and Tailwind, featuring dynamic client-side filtering, bookmarking, and slide-out deep-dive drawers.
* **Live Polling:** The client continuously polls the backend (every 5 seconds) and displays non-disruptive update banners when new intelligence arrives.

## Architecture
* **AI Generation:** ChatGPT Desktop App (Scheduled Tasks & Skills)
* **Backend:** FastAPI (Python), SQLAlchemy, SQLite (`newsroom.db`)
* **Frontend:** React (TypeScript), Vite, Tailwind CSS
* **Data Transfer:** JSON File-System Bridge → REST API (GET `/api/news`)

---

## Getting Started

### 1. Prerequisites
* **Python 3.8+** (for the FastAPI backend)
* **Node.js 18+** (for the React frontend)
* **ChatGPT Desktop App** (Mac/Windows with Workspace write permissions enabled)

### 2. Backend Setup
The backend handles folder monitoring, data parsing, and database persistence.

1. Navigate to the backend directory.
2. Install the required Python packages:
   `pip install fastapi uvicorn sqlalchemy pydantic`
3. Open `main.py` and update the `SYNC_FOLDER` variable to point to the directory where ChatGPT will save its JSON files.
4. Start the server:
   `python main.py`
   *The server will run on `http://127.0.0.1:8000` and automatically generate `newsroom.db` in the script's directory.*

### 3. Frontend Setup
The frontend provides the visual interface and handles data filtering.

1. Navigate to the frontend directory.
2. Install the Node dependencies:
   `npm install`
3. Start the development server:
   `npm run dev`
   *The UI will typically be available at `http://localhost:5173`.*

## Repository Structure
* `/backend`
  * `main.py` - FastAPI server, SQLite configuration, and ingestion logic.
* `/frontend`
  * `src/App.tsx` - Main React application, state management, and polling logic.
  * `src/types.ts` - TypeScript interfaces for the Article data model.
  * `src/components/ArticleDrawer.tsx` - Slide-out UI for deep-dive analysis.

