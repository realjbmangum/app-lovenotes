# PRD: LoveNotes MVP

## Overview
LoveNotes is a $5/month subscription that sends husbands daily SMS messages with pre-written love note suggestions they can copy and send to their wives. The MVP focuses on the core value prop: signup → receive SMS → copy/send to wife.

## Goals
1. Husbands receive daily love note suggestions via SMS
2. Simple signup flow that captures wife's name and delivery preferences
3. Stripe subscription handles payment ($5/month with 7-day trial)
4. Success metric: 10 paying subscribers within 30 days of launch

## Non-Goals (NOT building in MVP)
- Mobile app (SMS only for now)
- AI-generated messages (using pre-written library)
- Anniversary/milestone reminders
- Message history or favorites
- Multiple themes per user (one theme at signup, can't change)
- Account management dashboard (pause/cancel via email support)

## User Stories

### Story 1: Landing Page Polish
**As a** visitor
**I want to** understand the product and sign up
**So that** I can start receiving love notes

**Acceptance Criteria:**
- [ ] Landing page loads and looks good on mobile
- [ ] Form submits to backend (Cloudflare Worker)
- [ ] Form validation: email, phone, wife name required
- [ ] Success state shows "Check your phone for confirmation"
- [ ] Verify in browser: complete form submission works

**Technical Notes:**
- Already have landing page, just need to wire up form
- Phone number needs validation (US format)

---

### Story 2: Stripe Checkout Integration
**As a** user completing signup
**I want to** enter payment info
**So that** I can start my subscription

**Acceptance Criteria:**
- [ ] After form submit, redirect to Stripe Checkout
- [ ] Stripe session includes: 7-day trial, $5/month after
- [ ] On success, redirect back to /success page
- [ ] On cancel, redirect back to landing page
- [ ] Webhook receives payment confirmation
- [ ] Verify in browser: complete checkout flow works

**Technical Notes:**
- Use Stripe Checkout (hosted) - simplest approach
- Store customer data after webhook confirms payment
- Cloudflare Worker handles webhook

---

### Story 3: User Data Storage
**As a** system
**I want to** store subscriber data
**So that** I can send them messages

**Acceptance Criteria:**
- [ ] D1 database with `subscribers` table
- [ ] Fields: id, email, phone, wife_name, theme, frequency, stripe_customer_id, status, created_at
- [ ] Status: trial | active | cancelled | paused
- [ ] Data written after Stripe webhook confirms subscription
- [ ] Can query active subscribers for daily send

**Technical Notes:**
- Cloudflare D1 (SQLite)
- Simple schema, no relations needed for MVP

---

### Story 4: Message Library (Large Content Task)
**As a** system
**I want to** have a massive library of love notes
**So that** subscribers never see repeats for 2+ years

**Acceptance Criteria:**
- [ ] 730+ messages per theme (2 years of daily content)
- [ ] Themes: romantic, funny, appreciative, encouraging
- [ ] Special occasion messages: anniversary, birthday, Valentine's, Mother's Day, Christmas, "just because"
- [ ] Messages stored in D1 with proper indexing
- [ ] Each message has: id, theme, occasion (nullable), content, placeholder for {wife_name}
- [ ] Rotation logic ensures no repeats until full library exhausted

**Content Requirements:**
```
Daily themes (730 each = 2,920 total):
- Romantic: heartfelt, passionate, loving
- Funny: playful, witty, lighthearted
- Appreciative: gratitude, recognition, thankfulness
- Encouraging: supportive, motivating, uplifting

Special occasions (50 each = 300 total):
- Anniversary
- Birthday (her)
- Valentine's Day
- Mother's Day
- Christmas/Holidays
- "Just because" (random special)

TOTAL: ~3,200+ messages
```

**Technical Notes:**
- Content generation is separate task (use Claude to help write)
- Store in D1 `messages` table
- Track subscriber's message history to prevent repeats
- Occasion messages override daily theme on special dates

---

### Story 5: SMS Sender (Welcome + Daily)
**As a** subscriber
**I want to** receive a welcome SMS immediately and daily notes each morning
**So that** I know it's working and can send love to my wife

**Acceptance Criteria:**
- [ ] Welcome SMS sent immediately after successful Stripe webhook
- [ ] Welcome format: "Welcome to LoveNotes! Your first message for {wife_name} arrives tomorrow at 8am. Reply STOP to unsubscribe."
- [ ] Daily cron runs at 8am ET
- [ ] Queries active/trial subscribers
- [ ] Selects next message for each subscriber (no repeats)
- [ ] Checks for special occasions (anniversary, birthday) and uses occasion message if applicable
- [ ] Daily format: "💕 LoveNote for {wife_name}: {message} - Reply STOP to unsubscribe"
- [ ] Handles STOP replies (Twilio webhook updates subscriber status)
- [ ] Logs success/failure for each send

**Technical Notes:**
- Twilio for SMS ($0.0079/message)
- Cloudflare Cron Trigger for daily
- Twilio incoming webhook for STOP handling
- Need subscriber fields: wife_birthday, anniversary_date for occasion matching

---

### Story 6: Success & Confirmation Pages
**As a** new subscriber
**I want to** see confirmation after signup
**So that** I know it worked

**Acceptance Criteria:**
- [ ] /success page shows: "You're all set! First message coming tomorrow at 8am"
- [ ] Includes wife's name: "Get ready to make {wife_name} smile"
- [ ] Link to manage subscription (mailto: support email for MVP)
- [ ] Verify in browser: success page renders correctly

**Technical Notes:**
- Pass wife_name via URL param or session
- Static page, no auth needed

---

## Technical Considerations

**Stack:**
- Frontend: Next.js 15 (already set up)
- Backend: Cloudflare Workers
- Database: Cloudflare D1
- Payments: Stripe Checkout + Webhooks
- SMS: Twilio
- Hosting: Cloudflare Pages (frontend) + Workers (API)

**Data Model:**
```sql
CREATE TABLE subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  wife_name TEXT NOT NULL,
  theme TEXT DEFAULT 'romantic',
  frequency TEXT DEFAULT 'daily',
  anniversary_date TEXT,          -- YYYY-MM-DD
  wife_birthday TEXT,             -- MM-DD (year not needed)
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'trial',    -- trial | active | cancelled | paused
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY,
  theme TEXT NOT NULL,            -- romantic | funny | appreciative | encouraging
  occasion TEXT,                  -- NULL for daily, or: anniversary | birthday | valentines | mothers_day | christmas | just_because
  content TEXT NOT NULL           -- Use {wife_name} as placeholder
);

CREATE TABLE subscriber_message_history (
  subscriber_id TEXT,
  message_id INTEGER,
  sent_at DATETIME,
  PRIMARY KEY (subscriber_id, message_id)
);

CREATE TABLE send_log (
  id TEXT PRIMARY KEY,
  subscriber_id TEXT,
  message_id INTEGER,
  sent_at DATETIME,
  status TEXT,                    -- sent | failed | delivered
  twilio_sid TEXT
);
```

**External Services:**
- Stripe: Subscription billing
- Twilio: SMS delivery
- Cloudflare: Everything else

**Risks:**
- SMS deliverability (carrier filtering)
- Twilio costs at scale ($0.0079 × subscribers × 30 days)
- Phone number validation edge cases

## Resolved Questions
- ✅ STOP/unsubscribe handling: Yes, required by Twilio and good practice
- ✅ Welcome SMS: Yes, send immediately after Stripe confirms
- ✅ Message library size: 2 years of content (3,200+ messages) so repeats aren't an issue

## Open Questions
- What time zone logic for MVP? (Start with 8am ET for everyone, add TZ later?)
- Collect wife's birthday at signup or later?
- How to handle failed SMS deliveries? (retry? alert user?)

## Task Checklist
- [ ] Story 1: Landing Page Polish
- [ ] Story 2: Stripe Checkout Integration
- [ ] Story 3: User Data Storage
- [ ] Story 4: Message Library
- [ ] Story 5: Daily SMS Sender
- [ ] Story 6: Success & Confirmation Pages
- [ ] Final review and testing
