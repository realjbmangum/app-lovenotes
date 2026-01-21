-- LoveNotes D1 Schema

-- Subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  wife_name TEXT NOT NULL,
  nickname TEXT,
  theme TEXT DEFAULT 'romantic',
  frequency TEXT DEFAULT 'daily',
  anniversary_date TEXT,
  wife_birthday TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'trial',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  theme TEXT NOT NULL,
  occasion TEXT,
  content TEXT NOT NULL
);

-- Track which messages have been sent to each subscriber
CREATE TABLE IF NOT EXISTS subscriber_message_history (
  subscriber_id TEXT NOT NULL,
  message_id INTEGER NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (subscriber_id, message_id),
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id),
  FOREIGN KEY (message_id) REFERENCES messages(id)
);

-- Log all SMS sends
CREATE TABLE IF NOT EXISTS send_log (
  id TEXT PRIMARY KEY,
  subscriber_id TEXT NOT NULL,
  message_id INTEGER NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending',
  twilio_sid TEXT,
  error_message TEXT,
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id),
  FOREIGN KEY (message_id) REFERENCES messages(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_phone ON subscribers(phone);
CREATE INDEX IF NOT EXISTS idx_messages_theme ON messages(theme);
CREATE INDEX IF NOT EXISTS idx_messages_occasion ON messages(occasion);
CREATE INDEX IF NOT EXISTS idx_send_log_subscriber ON send_log(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_send_log_sent_at ON send_log(sent_at);
