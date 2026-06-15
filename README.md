# ESGVerify

ESGVerify is an AI-powered full-stack compliance and assessment platform tailored specifically for Indian Micro, Small, and Medium Enterprises (MSMEs). It helps factory owners seamlessly map operations against SEBI BRSR Core guidelines, calculate critical sustainability KPIs, detect greenwashing risks using a Mamdani Fuzzy Inference System, and evaluate buyer compliance readiness.

<img width="1512" height="812" alt="Screenshot 2026-06-15 at 11 54 31 PM" src="https://github.com/user-attachments/assets/22ffafbc-2206-4855-af6c-be6c882efd3b" />


##  Key Features

* **9 BRSR Core KPI Calculators:** Embedded metrics mapping regulatory benchmarks from the Central Pollution Control Board (CPCB), Bureau of Energy Efficiency (BEE), and Indian Factories Act 1948.
* **Mamdani FIS Fuzzy Logic Engine:** Custom pure-Python fuzzy logic that evaluates multi-variable inputs to flag greenwash risks and grade data consistency without third-party mathematical wrappers.
* **Cascade AI Tiering System:** An automated, resilient API client structure that routes queries iteratively through Groq (Free Tier) ➔ Gemini (Free Tier) ➔ OpenAI (Paid Tier) to guarantee uptime.
* **Interactive What-If Simulator:** Real-time data sandboxing letting businesses tweak resource sliders (e.g., daily recycled water volumes, wage variances) to dynamically preview compliance score changes.
* **Next.js App Router Architecture:** Fluid client-side state tracking wrapped in smooth, physics-based UI page transitions engineered via Framer Motion.

---

##  Tech Stack

### Frontend Web Client
* **Framework:** Next.js 14+ (React 18 Architecture)
* **Styling Engine:** Tailwind CSS
* **Animation System:** Framer Motion
* **UI Iconography:** Lucide React

### Backend Core Server
* **API Framework:** FastAPI (Asynchronous Python)
* **Secure Authentication:** Python-Jose (JWT Generation) & Passlib (Bcrypt Password Hashing)
* **Storage Framework:** SQLite3 (WAL Journaling enabled for optimal local persistence)

---

##  Project Directory Layout

```text
├── backend/                  # Asynchronous FastAPI Application Root
│   ├── components/           # Core Engines (calculator.py, fuzzy_scorer.py)
│   ├── routers/              # API Routers (auth_router.py, calculation.py)
│   ├── utils/                # Utility modules (ai_client.py)
│   ├── requirements.txt      # Python Environment Configuration
│   └── .env                  # Environment Variables 
│
├── frontend/                 # Next.js Application Root
│   ├── app/                  # Web App Route Segment Components
│   ├── components/           # Shared UI Layout Elements (HelpBot.tsx)
│   ├── package.json          # Node Module Configuration Dependencies
│   └── .env.local            # Client Runtime Variables 
│
└── .gitignore                # Global Repository Exclusions Shield

```

---

##  Execution & Deployment Guide

### 1. Backend Core Service Setup

1. Shift context into your backend terminal environment:
```bash
cd backend

```


2. Build and switch into a dedicated Python virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Windows command syntax: venv\Scripts\activate

```


3. Install the required runtime packages:
```bash
pip install -r requirements.txt
```


4. Create a `.env` configuration file inside your `backend/` root directory and fill in your API tokens:
```text
GROQ_API_KEY=gsk_your_private_groq_key_here
GEMINI_API_KEY=your_private_gemini_key_here
OPENAI_API_KEY=sk_your_private_openai_key_here
```


5. Spin up your local development server cluster using Uvicorn:
```bash
uvicorn main:app --reload
```



### 2. Frontend Interface Setup

1. Pivot back into your frontend codebase container folder:
```bash
cd ../frontend
```


2. Fetch and deploy your node package modules:
```bash
npm install
```


3. Establish a local environmental linkage layout by creating a `.env.local` file inside the `frontend/` folder:
```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```


4. Initialize the reactive development tracking client:
```bash
npm run dev
```

Open your terminal browser target and redirect execution flows to [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) to see the running system interface!
