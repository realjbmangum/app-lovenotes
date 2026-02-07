# PRD: SendMyLove v2 — The Pivot

## The Problem We're Solving

Men want to send their wives thoughtful messages but don't know what to say. The v1 approach (pre-written copy-paste messages) fails because:
- Generic messages feel fake — wives detect AI slop within days
- No personalization beyond name substitution
- Competes directly with free ChatGPT
- The message isn't *his* — it's a template wearing his name

**The real insight:** Guys don't lack feelings. They lack the trigger ("what do I even say?") and the confidence to say it well.

## The Solution

SendMyLove v2 is a **daily relationship communication nudge** that helps husbands express what they already feel, in their own voice.

**Core loop:**
1. Daily prompt arrives (themed question that sparks a real thought)
2. User fills in the blank with something real from their life
3. Optional AI polish to help him say it better
4. He sends it from his own number — it's genuinely his message

**We don't write the love note. We help him write it.**

## What Changes From v1

| Aspect | v1 (Current) | v2 (Pivot) |
|--------|-------------|------------|
| Messages | 2,515 static pre-written notes | Dynamic prompts + starters |
| Personalization | `{wife_name}` swap | Relationship context, inside jokes, recent events |
| User involvement | Copy-paste | Fill in the blank + optional AI polish |
| Intelligence | Random rotation | Learns what resonates, adapts over time |
| Moat | None (ChatGPT does this free) | Relationship memory + daily habit + personalization |
| Delivery | Email (SMS broken) | Email/push notification with in-app message builder |

## Goals

1. Pivot existing product with minimal rebuild (reuse auth, Stripe, worker infrastructure)
2. Launch v2 within 2 weeks
3. 10 paying subscribers within 30 days of v2 launch
4. Retention metric: 70%+ of users send at least 4 messages in their first month

## Non-Goals (Not in v2 MVP)

- Native mobile app (web app is fine)
- Two-way conversation tracking (we don't read her responses)
- Couples mode (wife doesn't need an account)
- AI voice/audio messages
- Social features (sharing, leaderboards)

---

## User Stories

### Story 1: Relationship Profile Onboarding

**As a** new user
**I want to** tell SendMyLove about my relationship
**So that** prompts feel personal, not generic

**Acceptance Criteria:**
- [ ] Onboarding flow after Stripe checkout (3-4 screens, < 2 minutes)
- [ ] Collects: wife's name, pet name/nickname, how you met (short text), years together, her love language (pick one), 2-3 inside jokes or things she loves, what she does that makes you smile
- [ ] Optional: anniversary date, her birthday, kids' names
- [ ] Data stored in D1 `relationship_profiles` table
- [ ] Can be edited later from dashboard/settings
- [ ] Skip option available (can fill in later)

**Screen Flow:**
```
Screen 1: "Let's get to know your relationship"
  - Wife's name (required)
  - Pet name / nickname
  - How long together (dropdown: <1yr, 1-3, 3-5, 5-10, 10-20, 20+)

Screen 2: "What makes her special?"
  - "How did you two meet?" (short text, 1-2 sentences)
  - "What's something she does that makes you smile?" (short text)
  - "Any inside jokes or things only you two get?" (short text, optional)

Screen 3: "Her favorites" (all optional)
  - Her love language (5 options dropdown)
  - Anniversary date
  - Her birthday
  - Kids' names (if any)

Screen 4: "Pick your vibe"
  - Theme preference (same as v1: romantic, funny, flirty, appreciative, encouraging, spicy, random)
  - Frequency (daily, weekdays only, 3x/week)
  - Delivery time preference (morning, afternoon, evening)
```

**Technical Notes:**
- Relationship profile feeds into prompt generation and AI polish context
- Store as structured data, not free text blob (enables better prompt templating)
- Love language maps to prompt weighting (e.g., "words of affirmation" = more verbal, "acts of service" = prompts about noticing what she does)

---

### Story 2: Daily Prompt Engine

**As a** subscriber
**I want to** receive a themed prompt each day
**So that** I have a starting point for what to say

**Acceptance Criteria:**
- [ ] Daily notification (email for now, push later) at user's preferred time
- [ ] Each prompt has: a question/nudge, a fill-in-the-blank starter, and the theme
- [ ] Prompts rotate through themes if user chose "random"
- [ ] Prompts reference relationship profile when available (her name, inside jokes, etc.)
- [ ] Special prompts for occasions (anniversary, birthday, Valentine's, etc.)
- [ ] Clicking the notification opens the message builder in-app
- [ ] Prompt history stored (never repeat within 90 days)

**Prompt Format:**
```
Theme: [Romantic / Funny / Flirty / etc.]
Nudge: [Question that sparks a real thought]
Starter: [Fill-in-the-blank sentence opener]
```

**Example Prompts by Theme:**

**Romantic:**
- Nudge: "What moment with {wife_name} do you keep replaying in your head?"
- Starter: "I keep thinking about when we ___"

- Nudge: "If you could relive one day with {wife_name}, which would it be?"
- Starter: "You know what I'd give anything to do again? ___"

**Funny:**
- Nudge: "What's the last ridiculous thing {wife_name} made you laugh about?"
- Starter: "I'm still laughing about when you ___"

- Nudge: "What's a weird habit of yours that {wife_name} somehow loves?"
- Starter: "The fact that you put up with my ___ is why I married you"

**Flirty/Spicy:**
- Nudge: "When's the last time {wife_name} made you do a double-take?"
- Starter: "I haven't stopped thinking about you in that ___"

- Nudge: "What's something about {wife_name} that still gets your heart racing?"
- Starter: "You probably don't realize this but when you ___ it drives me crazy"

**Appreciative:**
- Nudge: "What's something {wife_name} handles that you'd be completely lost without?"
- Starter: "I don't say this enough, but the way you ___ makes everything better"

- Nudge: "When did {wife_name} last go above and beyond for the family?"
- Starter: "I noticed what you did with ___ and I want you to know ___"

**Encouraging:**
- Nudge: "What's {wife_name} working on or worried about right now?"
- Starter: "I know ___ has been on your mind. I just want you to know ___"

- Nudge: "What's a strength of {wife_name}'s that she might not see in herself?"
- Starter: "You're so much ___ than you give yourself credit for"

**Occasion (Anniversary):**
- Nudge: "What's your favorite memory from your wedding day or early relationship?"
- Starter: "Happy anniversary babe. ___ years and I still ___"

**Technical Notes:**
- Prompt templates stored in D1 `prompt_templates` table
- Need ~50 prompts per theme minimum for v2 launch (300+ total)
- Cron trigger generates personalized prompt, stores in `daily_prompts` table, sends notification
- Prompt selection considers: theme preference, recency (no repeats), occasion calendar, relationship profile data

---

### Story 3: Message Builder (Core UX)

**As a** user who received a prompt
**I want to** fill in the blank and optionally polish my message
**So that** I can send something genuine that sounds like me

**Acceptance Criteria:**
- [ ] Message builder page shows today's prompt (nudge + starter)
- [ ] Text input area where user fills in the blank (starter is pre-populated, cursor at the blank)
- [ ] "Help me say this better" button → sends to AI for polish
- [ ] AI polish preserves the user's core content, just improves flow/wording
- [ ] AI polish uses relationship profile as context (tone, her name, inside jokes)
- [ ] "Try a different prompt" button → loads alternative prompt (same theme)
- [ ] Tone slider: sweet ↔ spicy (adjusts AI polish output)
- [ ] Preview of final message before sending/copying
- [ ] One-tap copy to clipboard
- [ ] "Send" button (when SMS/direct send is available — future)
- [ ] Save to favorites (star icon)
- [ ] Character count indicator
- [ ] Mobile-first design (this is primarily a phone experience)

**Screen Layout:**
```
┌─────────────────────────────┐
│ Today's Prompt              │
│ [Theme badge]               │
│                             │
│ "What moment with Sarah     │
│  do you keep replaying?"    │
│                             │
│ ┌─────────────────────────┐ │
│ │ I keep thinking about   │ │
│ │ when we [cursor here]   │ │
│ │                         │ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ [✨ Help me say it better]  │
│ [🔄 Different prompt]      │
│                             │
│ ── sweet ──●── spicy ──    │
│                             │
│ Preview:                    │
│ ┌─────────────────────────┐ │
│ │ "I keep thinking about  │ │
│ │  when we went to that   │ │
│ │  little restaurant in   │ │
│ │  Asheville and you..."  │ │
│ └─────────────────────────┘ │
│                             │
│ [📋 Copy]    [⭐ Save]     │
└─────────────────────────────┘
```

**AI Polish Behavior:**
- Input: User's raw text + relationship profile + theme + tone setting
- Output: Polished version that sounds natural, not AI-generated
- Rules for AI: Keep it short (2-4 sentences max), use his vocabulary level, don't add flowery language he wouldn't use, preserve his specific details
- Show before/after so user can pick which version to send
- User can edit the polished version

**Technical Notes:**
- AI polish calls Claude API (or OpenAI) via Cloudflare Worker
- System prompt includes relationship profile context
- Rate limit: 5 polish requests per day (prevent abuse, manage API costs)
- Estimated API cost: ~$0.001 per polish request (short text in/out)

---

### Story 4: "What Happened Today?" Quick Log

**As a** user
**I want to** quickly note something that happened today
**So that** tomorrow's prompt can reference real life

**Acceptance Criteria:**
- [ ] Quick-entry field on dashboard ("What happened today?" or "Anything noteworthy?")
- [ ] Single text input, max 280 characters (tweet-length)
- [ ] Optional tags: funny moment, sweet moment, tough day, win, date night
- [ ] Stored in `daily_logs` table with date
- [ ] Prompt engine can reference recent logs for context
- [ ] Not required — completely optional daily habit

**Examples:**
- "Sarah nailed her work presentation today"
- "Kids drove us both crazy but we laughed about it at dinner"
- "She wore that blue dress I love"
- "Had a great date night, tried the new Thai place"

**Technical Notes:**
- Logs feed into prompt personalization (next day's prompt might say: "Sarah crushed her presentation yesterday — how did that make you feel?")
- Store last 30 days of logs
- This is the secret weapon — makes prompts feel eerily personal over time

---

### Story 5: Dashboard & Message History

**As a** user
**I want to** see my history and manage my account
**So that** I can track my streak and revisit favorites

**Acceptance Criteria:**
- [ ] Dashboard shows: today's prompt (if not yet completed), streak counter, recent messages sent
- [ ] Message history: list of all messages composed with dates
- [ ] Favorites: starred messages for re-use or reference
- [ ] Settings: edit relationship profile, change theme/frequency, manage subscription
- [ ] Streak visualization (calendar heatmap or simple counter)
- [ ] "Quick log" entry field always visible on dashboard

**Technical Notes:**
- Reuse existing auth (JWT cookies)
- Existing dashboard page gets redesigned for v2
- Streak = consecutive days where user composed a message (not just received a prompt)

---

### Story 6: Prompt Template Library (Content Task)

**As a** system
**I want to** have a rich library of prompt templates
**So that** prompts feel fresh for months

**Acceptance Criteria:**
- [ ] Minimum 50 prompts per theme (6 themes = 300 prompts)
- [ ] Each prompt has: theme, nudge_text, starter_text, occasion (nullable), tags
- [ ] Prompts use `{wife_name}`, `{nickname}`, `{years_together}` placeholders
- [ ] Some prompts reference daily logs when available
- [ ] Occasion-specific prompts for: anniversary, birthday, Valentine's, Mother's Day, Christmas, New Year's
- [ ] Quality bar: prompts should feel like a thoughtful friend asking you a good question, NOT like a therapist or greeting card

**Quality Guidelines:**
- NO generic Hallmark language
- Prompts should evoke a SPECIFIC memory or feeling, not vague sentiments
- Starters should be conversational, not poetic
- Think "what would a buddy who's great with women tell you to text her?"
- Test: Would a real person actually say this out loud? If not, rewrite.

---

## Technical Architecture

### What We Keep From v1
- Next.js 15 frontend (redesign pages)
- Cloudflare Worker API (add new endpoints)
- D1 database (add new tables, keep subscribers table)
- Stripe integration (no changes needed)
- JWT auth (no changes)
- SendGrid email delivery (for prompt notifications)

### What We Add
- **AI API integration** — Claude API via Cloudflare Worker for message polish
- **New D1 tables** — relationship_profiles, prompt_templates, daily_prompts, daily_logs, message_compositions, favorites
- **New Worker endpoints** — prompt generation, AI polish, daily log, message history
- **Redesigned frontend** — onboarding flow, message builder, new dashboard

### What We Remove
- Static message library (2,515 pre-written messages) — replaced by prompt templates
- Random message rotation logic — replaced by prompt engine

### New Database Schema

```sql
-- Relationship context (the moat)
CREATE TABLE relationship_profiles (
  subscriber_id TEXT PRIMARY KEY,
  wife_name TEXT NOT NULL,
  nickname TEXT,
  how_met TEXT,                    -- Short text
  years_together TEXT,             -- Range bucket
  love_language TEXT,              -- words, acts, gifts, time, touch
  inside_jokes TEXT,               -- Short text
  what_makes_her_smile TEXT,       -- Short text
  kids_names TEXT,                 -- Comma-separated
  anniversary_date TEXT,           -- YYYY-MM-DD
  wife_birthday TEXT,              -- MM-DD
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Prompt templates (replaces static messages)
CREATE TABLE prompt_templates (
  id INTEGER PRIMARY KEY,
  theme TEXT NOT NULL,              -- romantic, funny, flirty, appreciative, encouraging, spicy
  occasion TEXT,                    -- NULL for daily, or anniversary/birthday/etc
  nudge_text TEXT NOT NULL,         -- The question/thought trigger
  starter_text TEXT NOT NULL,       -- Fill-in-the-blank opener
  requires_log INTEGER DEFAULT 0,  -- 1 if this prompt references daily_logs
  tags TEXT,                        -- Comma-separated tags for smarter selection
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Daily prompts sent to users
CREATE TABLE daily_prompts (
  id INTEGER PRIMARY KEY,
  subscriber_id TEXT NOT NULL,
  prompt_template_id INTEGER NOT NULL,
  personalized_nudge TEXT NOT NULL,  -- With placeholders filled
  personalized_starter TEXT NOT NULL,
  sent_at DATETIME,
  completed INTEGER DEFAULT 0,       -- 1 if user composed a message
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User's daily quick logs
CREATE TABLE daily_logs (
  id INTEGER PRIMARY KEY,
  subscriber_id TEXT NOT NULL,
  log_text TEXT NOT NULL,
  tag TEXT,                          -- funny, sweet, tough, win, date_night
  log_date TEXT NOT NULL,            -- YYYY-MM-DD
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Composed messages (what the user actually wrote/sent)
CREATE TABLE message_compositions (
  id INTEGER PRIMARY KEY,
  subscriber_id TEXT NOT NULL,
  daily_prompt_id INTEGER,
  raw_text TEXT NOT NULL,            -- What user typed
  polished_text TEXT,                -- AI-polished version (if used)
  final_text TEXT NOT NULL,          -- What user chose to send
  tone_setting TEXT DEFAULT 'sweet', -- sweet, balanced, spicy
  is_favorite INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### New API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/profile` | GET | Yes | Get relationship profile |
| `/api/profile` | POST/PUT | Yes | Create/update relationship profile |
| `/api/prompt/today` | GET | Yes | Get today's personalized prompt |
| `/api/prompt/alternative` | GET | Yes | Get a different prompt (same theme) |
| `/api/compose` | POST | Yes | Save a composed message |
| `/api/polish` | POST | Yes | AI polish a draft message |
| `/api/log` | POST | Yes | Save a daily log entry |
| `/api/log` | GET | Yes | Get recent log entries |
| `/api/history` | GET | Yes | Get message composition history |
| `/api/favorites` | GET | Yes | Get favorited messages |
| `/api/favorites/:id` | POST/DELETE | Yes | Toggle favorite |

### AI Polish System Prompt (Draft)

```
You are helping a husband send a genuine text message to his wife.

Context about their relationship:
- Her name: {wife_name}
- Pet name: {nickname}
- Together: {years_together}
- How they met: {how_met}
- Inside jokes: {inside_jokes}

Rules:
- Keep it SHORT (2-4 sentences max, this is a text message)
- Sound like HIM, not like a poet or greeting card
- Preserve every specific detail he mentioned
- Don't add flowery language or cliches
- Don't add emojis unless his draft has them
- Match the tone setting: {tone} (sweet / balanced / spicy)
- This should read like a real text from a real husband

His draft: "{user_draft}"

Polished version:
```

---

## Implementation Plan

### Phase 1: Core Pivot (Week 1)
1. **Story 6** — Write 300+ prompt templates (can parallelize with dev work)
2. **Story 1** — Build onboarding flow (relationship profile)
3. **Story 2** — Build prompt engine (template selection, personalization, cron)
4. **Story 3** — Build message builder (the core UX)

### Phase 2: Polish & Habit (Week 2)
5. **Story 4** — Add daily log feature
6. **Story 5** — Redesign dashboard (streak, history, favorites)
7. Landing page rewrite (new value prop, new copy)
8. Testing & deployment

### Phase 3: Post-Launch (Week 3+)
- Response tracking ("Did she respond well?")
- Push notifications (web push API)
- Prompt quality refinement based on usage data
- SMS delivery when Twilio is resolved

---

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|-------------|
| Signups (30 days) | 10 paid subscribers | Stripe dashboard |
| Activation | 80% complete onboarding | relationship_profiles count |
| Engagement | 70% compose 4+ messages in month 1 | message_compositions table |
| AI polish usage | 50%+ of compositions use polish | polished_text not null rate |
| Daily log adoption | 30% of users log at least weekly | daily_logs count |
| Retention (month 2) | 60%+ still subscribed | Stripe churn rate |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI API costs at scale | Could eat into $5/month margin | Rate limit polish to 5/day; Claude Haiku is cheap (~$0.001/request) |
| Prompt quality feels generic | Users churn | Invest heavily in prompt writing; use daily logs for personalization |
| Users don't fill in the blank | Core value prop fails | Make starters easy to complete; show example completions |
| SMS still broken | Can't deliver prompts to phone | Email works for now; add web push notifications as bridge |
| Wives discover the service | Trust issue | Marketing addresses this: "We help you say what you feel, in your words" |

---

## Open Questions

*All resolved — see below.*

---

## Resolved Decisions

- Keep themes (romantic, funny, flirty, appreciative, encouraging, spicy) — they work as prompt categories
- Keep Stripe at **$5/month** with 7-day trial — price stays the same
- **Free tier: Yes** — 1 prompt/week (no AI polish). Paid = daily prompts + AI polish + daily logs
- **Onboarding happens AFTER Stripe checkout** — card entered first, then relationship profile setup. First personalized prompt is the reward for completing onboarding.
- **Copy-paste, not direct send** — husband copies message and sends from his own number. This IS the product. She sees it from him, not from a service.
- **Old message library: Mine for prompt templates, then delete** — extract the best patterns/themes from the 2,515 messages to create fill-in-the-blank starters, then remove the static library
- Email delivery for prompt notifications (SMS is broken, don't block on it)
- Web app message builder, not SMS-based composition
- AI polish is optional, not forced — the message should work even without it
- Mobile-first design (most husbands will use this on their phone in the morning)
