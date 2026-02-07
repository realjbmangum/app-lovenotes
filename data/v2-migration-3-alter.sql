-- SendMyLove v2 Migration - Part 3: Add tier column to subscribers
-- Run: wrangler d1 execute lovenotes-db --file=data/v2-migration-3-alter.sql --env production
-- NOTE: May fail if column already exists — that's fine.

ALTER TABLE subscribers ADD COLUMN tier TEXT DEFAULT 'free';
