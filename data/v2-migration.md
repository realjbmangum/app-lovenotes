# V2 Migration SQL

Run these in the **Cloudflare D1 console** one block at a time. Each block is a separate paste.

---

## Step 1: Create new tables

Paste this entire block:

```sql
CREATE TABLE IF NOT EXISTS relationship_profiles (
  subscriber_id TEXT PRIMARY KEY,
  wife_name TEXT NOT NULL,
  nickname TEXT,
  how_met TEXT,
  years_together TEXT,
  love_language TEXT,
  inside_jokes TEXT,
  what_makes_her_smile TEXT,
  kids_names TEXT,
  anniversary_date TEXT,
  wife_birthday TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id)
);

CREATE TABLE IF NOT EXISTS prompt_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  theme TEXT NOT NULL,
  occasion TEXT,
  nudge_text TEXT NOT NULL,
  starter_text TEXT NOT NULL,
  requires_log INTEGER DEFAULT 0,
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscriber_id TEXT NOT NULL,
  prompt_template_id INTEGER NOT NULL,
  personalized_nudge TEXT NOT NULL,
  personalized_starter TEXT NOT NULL,
  sent_at DATETIME,
  completed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id),
  FOREIGN KEY (prompt_template_id) REFERENCES prompt_templates(id)
);

CREATE TABLE IF NOT EXISTS daily_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscriber_id TEXT NOT NULL,
  log_text TEXT NOT NULL,
  tag TEXT,
  log_date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id)
);

CREATE TABLE IF NOT EXISTS message_compositions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscriber_id TEXT NOT NULL,
  daily_prompt_id INTEGER,
  raw_text TEXT NOT NULL,
  polished_text TEXT,
  final_text TEXT NOT NULL,
  tone_setting TEXT DEFAULT 'sweet',
  is_favorite INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id),
  FOREIGN KEY (daily_prompt_id) REFERENCES daily_prompts(id)
);
```

## Step 2: Add columns to subscribers (run separately)

Paste this one line — may fail if column already exists, that's OK:

```sql
ALTER TABLE subscribers ADD COLUMN onboarding_complete INTEGER DEFAULT 0;
```

Then paste this one:

```sql
ALTER TABLE subscribers ADD COLUMN tier TEXT DEFAULT 'free';
```

## Step 3: Create indexes

```sql
CREATE INDEX IF NOT EXISTS idx_prompt_templates_theme ON prompt_templates(theme);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_occasion ON prompt_templates(occasion);
CREATE INDEX IF NOT EXISTS idx_daily_prompts_subscriber ON daily_prompts(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_daily_prompts_date ON daily_prompts(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_logs_subscriber ON daily_logs(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_message_compositions_subscriber ON message_compositions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_message_compositions_favorite ON message_compositions(is_favorite);
```

## Step 4: Seed prompt templates

See [[seed-prompts]] — paste the INSERT statements from that file after the tables exist.
