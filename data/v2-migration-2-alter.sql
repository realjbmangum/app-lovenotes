-- SendMyLove v2 Migration - Part 2: Add columns to subscribers
-- Run: wrangler d1 execute lovenotes-db --file=data/v2-migration-2-alter.sql --env production
-- NOTE: These may fail if columns already exist — that's fine, just means they were already added.

ALTER TABLE subscribers ADD COLUMN onboarding_complete INTEGER DEFAULT 0;
