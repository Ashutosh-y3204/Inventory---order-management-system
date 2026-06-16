# InventoryOS — Inventory Management System

A full-stack inventory management system with user-isolated workspaces, real-time stock control, and revenue analytics.

---

## Stack
- **Frontend**: React + Vite + Tailwind CSS + Recharts
- **Backend**: FastAPI + SQLAlchemy + SQLite/PostgreSQL
- **Auth**: JWT tokens

---

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # edit DATABASE_URL and SECRET_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env            # set VITE_API_URL=http://localhost:8000
npm run dev
```

---

## Deploy to Vercel

### Frontend (Vercel)
1. Push code to GitHub
2. Import frontend folder in [vercel.com](https://vercel.com)
3. Set **Framework**: Vite
4. Set **Root Directory**: `frontend`
5. Add environment variable:
   - `VITE_API_URL` = your backend URL (e.g. `https://your-api.railway.app`)
6. Deploy — the `vercel.json` handles SPA routing automatically

### Backend (Railway / Render / Fly.io)
**Railway** (recommended):
1. New project → Deploy from GitHub → select `backend` folder
2. Set environment variables:
   - `DATABASE_URL` = PostgreSQL connection string (Railway provides this)
   - `SECRET_KEY` = random 32+ char string
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Render**:
1. New Web Service → connect GitHub → root dir: `backend`
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login → JWT token |
| GET | `/api/products/` | List products |
| POST | `/api/products/` | Create product |
| PUT | `/api/products/{id}` | Update product |
| DELETE | `/api/products/{id}` | Delete product |
| POST | `/api/products/{id}/restock` | Add stock |
| POST | `/api/products/{id}/adjust-stock` | Adjust stock (±) |
| GET | `/api/products/{id}/transactions` | Transaction history |
| GET | `/api/customers/` | List customers |
| POST | `/api/customers/` | Create customer |
| GET | `/api/orders/` | List orders |
| POST | `/api/orders/` | Create order (reduces stock) |
| POST | `/api/orders/{id}/cancel` | Cancel order (restores stock) |
| GET | `/api/dashboard/stats` | Revenue, totals, alerts |
| GET | `/api/dashboard/revenue-by-category` | Revenue pie chart |
| GET | `/api/dashboard/stock-status` | Stock bar chart |
| GET | `/api/dashboard/low-stock-table` | Low stock alerts |
| GET | `/api/dashboard/recent-orders` | Recent orders feed |
