# LoveNotes

> **$5/month subscription that helps husbands send daily love notes to their wives.**

Pick a vibe. Get a message. Copy and send. Simple.

---

## What is LoveNotes?

LoveNotes is a relationship-strengthening app that sends husbands daily SMS reminders with pre-written, personalized love messages to copy and send to their wives. No more "I'm not good with words" excuses.

### Key Features

- **8 Message Voices** - Quick, Flirty, Deep, Grateful, Sorry, Supportive, Proud, Playful
- **2,140+ Messages** - Enough content for 6+ years without repeats
- **Personalized** - Messages include your wife's name
- **Never Repeats** - Smart rotation ensures fresh content
- **Cookie-based Auth** - Secure JWT authentication
- **Dark Mode Dashboard** - Beautiful, modern interface

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, Tailwind CSS, shadcn/ui |
| **Backend** | Cloudflare Workers |
| **Database** | Cloudflare D1 (SQLite) |
| **Auth** | JWT tokens via httpOnly cookies |
| **Payments** | Stripe Checkout (pending) |
| **SMS** | Twilio (pending) |

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm or npm
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account (for D1 database)

### Installation

```bash
# Clone the repository
git clone https://github.com/realjbmangum/app-lovenotes.git
cd app-lovenotes

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be running at `http://localhost:3000`

### Running the Worker (API)

In a separate terminal:

```bash
# Log into Cloudflare (first time only)
wrangler login

# Start the worker dev server
wrangler dev --remote
```

The API will be running at `http://localhost:8787`

---

## Project Structure

```
app-lovenotes/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page with signup form
│   ├── dashboard/         # Message picker dashboard
│   │   └── page.tsx
│   ├── success/           # Post-signup confirmation
│   │   └── page.tsx
│   └── api/               # API routes
├── worker/                # Cloudflare Worker
│   └── index.ts          # API endpoints
├── lib/                   # Utilities
│   ├── api.ts            # API client + validation
│   └── utils.ts          # Helper functions
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── data/                  # Database files
│   ├── schema.sql        # D1 schema
│   ├── seed-voices.sql   # Message seed data
│   └── voices/           # Message JSON files
├── scripts/               # Build scripts
│   └── compile-voices.js # Compiles messages to SQL
├── tasks/                 # Project documentation
│   └── prd-lovenotes-mvp.md
├── wrangler.toml         # Cloudflare config
└── package.json
```

---

## API Reference

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/signup` | POST | Create new subscriber |
| `/api/messages/random` | GET | Get random message by theme |
| `/api/health` | GET | Health check |

### Protected Endpoints (Requires Auth Cookie)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/subscriber` | GET | Get current subscriber info |
| `/api/messages/next` | GET | Get next unseen message |

### Dev-Only Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/test/create-user` | POST | Create test user (blocked in prod) |

---

## Database Schema

```sql
-- Subscribers table
CREATE TABLE subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  wife_name TEXT NOT NULL,
  theme TEXT DEFAULT 'romantic',
  frequency TEXT DEFAULT 'daily',
  anniversary_date TEXT,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'trial',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Messages library (2,140 messages)
CREATE TABLE messages (
  id INTEGER PRIMARY KEY,
  theme TEXT NOT NULL,
  content TEXT NOT NULL
);

-- Message history (prevents repeats)
CREATE TABLE subscriber_message_history (
  subscriber_id TEXT,
  message_id INTEGER,
  sent_at DATETIME,
  PRIMARY KEY (subscriber_id, message_id)
);
```

---

## Message Voices

| Voice | Count | Use Case |
|-------|-------|----------|
| `quick` | 50 | Fast, easy sends |
| `flirty` | 50 | Keep the spark alive |
| `deep` | 50 | Real emotional connection |
| `grateful` | 50 | Genuine appreciation |
| `sorry` | 50 | Real apologies |
| `supportive` | 50 | When she's struggling |
| `proud` | 50 | Celebrating her wins |
| `playful` | 50 | Lighthearted fun |

**Total: 400 voice messages + 2,000+ themed messages = 2,140+ messages**

---

## Development Commands

```bash
# Start Next.js dev server
npm run dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Lint code
npm run lint

# Build for production
npm run build
```

### Cloudflare Commands

```bash
# Start worker locally (connects to remote D1)
wrangler dev --remote

# Seed messages to database
node scripts/compile-voices.js
wrangler d1 execute lovenotes-db --remote --file=data/seed-voices.sql

# Deploy worker to production
wrangler deploy
```

---

## Environment Variables

Create a `.env.local` file:

```bash
# API URL (worker)
NEXT_PUBLIC_API_URL=http://localhost:8787/api

# Stripe (when ready)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Twilio (when ready)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

---

## Deployment

### Frontend (Cloudflare Pages)

```bash
npm run build
# Deploy via Cloudflare Pages dashboard or Wrangler
```

### Backend (Cloudflare Workers)

```bash
wrangler deploy
```

---

## MVP Status

### Completed
- [x] Landing page with signup form
- [x] Mobile-responsive design
- [x] Success page with dashboard link
- [x] Dashboard with 8-voice selector
- [x] Cloudflare Worker API
- [x] D1 database with schema
- [x] 2,140+ messages seeded
- [x] Full signup flow working
- [x] JWT authentication with httpOnly cookies
- [x] CORS restricted to specific origins
- [x] Vitest test infrastructure

### Pending
- [ ] Stripe Checkout integration (needs API keys)
- [ ] Twilio SMS sending (needs credentials)
- [ ] Cron trigger for daily sends
- [ ] Production deployment

---

## Screenshots

*Screenshots coming soon*

### Landing Page
Beautiful gradient landing page with signup form, testimonials, pricing, and FAQ.

### Dashboard
Dark-themed dashboard with 8 colorful voice buttons. Tap a vibe, get a message, copy and send.

### Success Page
Clean confirmation page after signup with next steps.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - feel free to use this for your own projects.

---

## Support

For questions or issues, email: support@lovenotes.app

---

*Built with love for husbands who want to be better at showing it.*
