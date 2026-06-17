# FinanceIQ

FinanceIQ is a full-stack personal finance platform with AI-assisted planning, analytics, alerts, portfolio insights, market intelligence, and document intake.

It combines:
- a `Next.js` frontend for dashboards and workflows
- an `Express` backend for auth, finance logic, AI features, and integrations
- a `FastAPI` ML service for risk scoring, stress prediction, and Monte Carlo simulation
- a `PostgreSQL` database for app data and analytics state

## Highlights

- Email/password auth plus Google sign-in
- Dashboards for transactions, budgets, goals, savings, debts, and portfolio
- FinanceIQ copilot with grounded answers and structured citations
- Goal probability engine and debt payoff optimizer
- Budget autopilot and personalized alert intelligence
- Market Intelligence page with live market context, macro pulse, and finance explainers
- Scenario planner and life event planner
- Document intelligence for pasted OCR text and `.txt` / `.csv` imports

## Project Structure

```text
finance/
|- frontend/      Next.js 14 app
|- backend/       Express API
|- ml-service/    FastAPI ML service
|- database/      SQL schema
`- README.md      Main project documentation
```

## Tech Stack

- Frontend: `Next.js`, `React`, `TypeScript`, `Tailwind CSS`, `Recharts`
- Backend: `Node.js`, `Express`, `PostgreSQL`, `JWT`, `bcrypt`, `axios`
- ML service: `FastAPI`, `scikit-learn`, `NumPy`, `Pandas`, `SciPy`

## Main Features

### Core finance
- Transactions, savings, debts, goals, budgets, and wealth tracking
- Financial health scoring
- Portfolio analysis and explainability
- Alerts and recommendation engine

### AI and planning
- FinanceIQ copilot with app-data grounding
- Market snapshot, macro pulse, and trend interpretation
- Cashflow forecasting
- Goal success probability
- Debt payoff optimization
- Budget autopilot
- Scenario planner
- Life event planner
- Document intelligence with transaction import

### Integrations
- Google OAuth
- Email verification and password reset

## Current Limitations

- Document intelligence does not yet include native PDF/image OCR
- Transaction categorization is heuristic-assisted, not a trained feedback loop yet
- Automated test coverage is still limited

## Prerequisites

- `Node.js` 18+
- `npm`
- `Python` 3.9+
- `PostgreSQL`

## Setup

### 1. Install dependencies

From the repository root:

```bash
npm run install:all
```

Install ML service dependencies separately:

```bash
cd ml-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment variables

Create and fill:

- `backend/.env`
- `frontend/.env`

Important backend variables:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

DATABASE_URL=postgresql://postgres:password@localhost:5432/finance_db

JWT_SECRET=replace_with_a_long_random_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GROQ_API_KEY=your_groq_api_key
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.3-70b-versatile

TWELVE_DATA_API_KEY=your_twelve_data_api_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
FRED_API_KEY=your_fred_api_key

```

Important frontend variable:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Initialize the database

Run:

```bash
psql "<your_database_url>" -f database/schema.sql
```

The backend also bootstraps missing tables on startup.

### 4. Start the app

Frontend and backend:

```bash
npm run dev:all
```

ML service in a separate terminal:

```bash
cd ml-service
venv\Scripts\activate
python app.py
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- ML service: `http://localhost:8000`

## Useful Scripts

Root:

- `npm run dev:frontend`
- `npm run dev:backend`
- `npm run dev:all`
- `npm run install:all`

Backend:

- `npm run dev`
- `npm start`

Frontend:

- `npm run dev`
- `npm run build`
- `npm start`

## Key Backend Routes

- `/api/auth`
- `/api/finance`
- `/api/transactions`
- `/api/goals`
- `/api/savings`
- `/api/debts`
- `/api/portfolio`
- `/api/alerts`
- `/api/analytics`
- `/api/budget`
- `/api/wealth`
- `/api/documents`
- `/api/markets`

Health check:

- `GET /health`

## ML Service Endpoints

- `POST /api/risk-assessment`
- `POST /api/stress-prediction`
- `POST /api/monte-carlo`

## Recommended Manual Checks

After startup, verify:

1. Sign up and sign in
2. Google login flow
3. Dashboard loads
4. Transactions and budgets save correctly
5. Goal projections render
6. Copilot answers and shows citations
7. Alerts page shows recommendations
8. Document intelligence imports transactions
9. Life event planner saves a goal
10. AI chat page answers grounded finance questions
11. Market Intelligence page loads live market and macro data

## Production Notes

- Rotate any secrets that were ever committed locally
- For Groq in production, create a hosted API key and set `GROQ_API_KEY`, `GROQ_BASE_URL`, and `GROQ_MODEL` in `backend/.env`
- Use a strong `JWT_SECRET` and real SMTP credentials
- Lock down CORS to your deployed frontend URL
- Add automated tests before a real production launch

## Status

FinanceIQ is now a strong portfolio-grade full-stack project with substantial AI/ML product surface. It is close to production shape, but still needs fuller test coverage and final live-integration hardening for a true production launch.
