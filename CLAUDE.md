# LoveNotes - Claude Instructions

## Overview
LoveNotes is a $5/month subscription that sends husbands daily SMS love note suggestions to copy and send to their wives.

## Tech Stack
- **Frontend:** Next.js 15, React 19, Tailwind CSS, shadcn/ui
- **Backend:** Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **Payments:** Stripe Checkout (pending integration)
- **SMS:** Twilio (pending integration)

## Current State (Jan 2025)
- Landing page complete with form validation and mobile hamburger menu
- Success page with dashboard link
- Dashboard page for viewing/copying messages
- Cloudflare Worker API at `worker/index.ts`
- D1 database with 2,140 messages seeded
- Full signup flow working (creates user in D1)
- **JWT authentication with httpOnly cookies** (added Jan 20)
- **CORS restricted to specific origins** (added Jan 20)
- **Test endpoint gated to dev only** (added Jan 20)
- **Vitest test infrastructure** (added Jan 20)

## Message Library
- **romantic:** 850 messages
- **appreciative:** 410 messages
- **encouraging:** 400 messages
- **funny:** 400 messages
- **occasions:** 80 messages (anniversary, birthday, valentine's, etc.)

Total: 2,140 messages (enough for ~6 years of daily messages)

## Development

```bash
# Start Next.js dev server
npm run dev

# Start Worker dev server (in separate terminal)
cd /Users/jbm/new-project/app-lovenotes
wrangler dev --remote

# Seed messages to D1
node scripts/compile-messages.js
wrangler d1 execute lovenotes-db --remote --file=data/seed-messages.sql

# Generate more messages
node scripts/generate-more-messages.js
```

## API Endpoints (Worker)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/signup` | POST | No | Create new subscriber (returns JWT cookie) |
| `/api/subscriber` | GET | **Yes** | Get current subscriber (from JWT) |
| `/api/messages/next` | GET | **Yes** | Get next unseen message for subscriber |
| `/api/messages/random` | GET | No | Get random message by theme |
| `/api/test/create-user` | POST | No | Create test user (dev only, blocked in prod) |
| `/api/health` | GET | No | Health check |

**Auth:** Protected endpoints require JWT token via httpOnly cookie (`lovenotes_auth`)

## Database Schema

```sql
-- subscribers: User accounts
-- messages: Love note library (2,140 messages)
-- subscriber_message_history: Tracks sent messages (prevents repeats)
-- send_log: SMS delivery tracking (for Twilio)
```

## PRD Stories Status
- [x] Story 1: Landing Page Polish
- [ ] Story 2: Stripe Checkout Integration (blocked - needs Stripe keys)
- [x] Story 3: User Data Storage (D1)
- [x] Story 4: Message Library (2,140 messages)
- [ ] Story 5: SMS Sender (blocked - needs Twilio)
- [x] Story 6: Success & Dashboard Pages

## Key Files
- `app/page.tsx` - Landing page with signup form
- `app/success/page.tsx` - Post-signup confirmation
- `app/dashboard/page.tsx` - Message viewing/copying
- `worker/index.ts` - Cloudflare Worker API
- `lib/api.ts` - API client with validation helpers
- `data/messages/*.json` - Message library
- `data/schema.sql` - D1 database schema
- `tasks/prd-lovenotes-mvp.md` - Full PRD

## Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui
```

**Test files:**
- `lib/api.test.ts` - Validation function tests

**Note:** Dashboard now uses cookie-based auth. Test users must be created via the signup flow or `/api/test/create-user` endpoint (dev only).

## Next Steps
1. Add Stripe Checkout for payments
2. Add Twilio for SMS delivery
3. Deploy Worker to production
4. Set up cron trigger for daily message sending

## Notes
- Phone numbers stored as 10 digits (no formatting)
- Wife's name used as `{wife_name}` placeholder in messages
- Messages cycle through without repeating (tracked in D1)
- Anniversary date format: YYYY-MM-DD
