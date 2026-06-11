# ⚡ EasyPay

**Payments, simplified.**

EasyPay turns a tedious Stripe dashboard slog into a 30-second wizard. Paste your key, name your product, set a price — out comes a shareable payment link. No navigation, no confusion, no Stripe docs.

## Project Structure

```
easypay/
├── client/          # Vite + React frontend
│   ├── src/
│   │   ├── App.jsx      # Main app with routing
│   │   ├── App.css      # All styles
│   │   ├── Welcome.jsx  # Landing page with payment
│   │   ├── Wizard.jsx   # 3-step wizard (key → product → link)
│   │   └── main.jsx     # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/          # Node.js + Express backend
│   ├── index.js         # API server with Stripe integration
│   ├── .env.example     # Environment variable template
│   └── package.json
└── README.md
```

## How It Works

1. **Pay $5** — One-time fee via Stripe Checkout
2. **Paste your Stripe key** — Your secret API key (starts with `sk_` or `rk_`)
3. **Name your product & set price** — What are you selling?
4. **Get a shareable payment link** — Ready to send to customers

## Setup

### Prerequisites

- Node.js 18+
- A Stripe account (for collecting fees) — set your secret key in the server
- A Stripe account whose payment link you want to create — the user provides their own key

### Backend

```bash
cd server
cp .env.example .env
# Edit .env: set YOUR_STRIPE_SECRET_KEY to your Stripe secret key
npm install
npm run dev
```

The server runs on `http://localhost:3001` by default.

### Frontend

```bash
cd client
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` by default.

### Environment Variables (Server)

| Variable | Description |
|---|---|
| `OUR_STRIPE_SECRET_KEY` | Your Stripe secret key (for collecting the $5 fee) |
| `FRONTEND_URL` | Frontend URL for CORS and redirects (default: http://localhost:5173) |
| `PORT` | Server port (default: 3001) |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/create-checkout-session` | Creates a $5 Stripe Checkout session |
| GET | `/api/check-payment-status?session_id=xxx` | Checks if a payment succeeded |
| POST | `/api/create-payment-link` | Creates product, price, and payment link in user's Stripe account |
| GET | `/api/health` | Health check |

## Tech Stack

- **Frontend:** Vite + React (React Router for navigation)
- **Backend:** Node.js + Express
- **Payments:** Stripe API (Checkout Sessions, Products, Prices, Payment Links)

## License

MIT