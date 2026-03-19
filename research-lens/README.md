# ResearchLens — AI Research Gap Discovery System

A production-grade full-stack web application that helps researchers discover unexplored gaps in academic literature. Enter any topic, and the system autonomously maps the research landscape, identifies saturated areas, surfaces genuine gaps, and generates structured research proposals.

## Quick Start

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file:

```
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
```

Start the backend:

```bash
uvicorn main:app --reload
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Open the App

Visit [http://localhost:5173](http://localhost:5173). Enter your name and research topic, then click **Discover Gaps**.

## Tech Stack

- **Frontend:** React, Vite, TailwindCSS, Recharts
- **Backend:** FastAPI (Python)
- **LLM:** Groq API (llama-3.3-70b-versatile)
- **Search:** Tavily API
- **Database:** SQLite (built-in)

## API Keys

- **Groq:** [console.groq.com](https://console.groq.com)
- **Tavily:** [tavily.com](https://tavily.com)

## Project Structure

```
research-lens/
├── backend/
│   ├── main.py           # FastAPI app & routes
│   ├── database.py       # SQLite schema & init
│   ├── services/
│   │   ├── search.py     # Tavily research search
│   │   ├── landscape.py  # Landscape mapping
│   │   ├── gap_finder.py # Gap identification & ranking
│   │   └── proposal_generator.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── AnalysisView.jsx
│   │   │   ├── ProgressStepper.jsx
│   │   │   ├── LandscapeCard.jsx
│   │   │   ├── GapsPanel.jsx
│   │   │   ├── ProposalPanel.jsx
│   │   │   └── HistoryPanel.jsx
│   │   └── services/api.js
│   └── package.json
└── README.md
```
