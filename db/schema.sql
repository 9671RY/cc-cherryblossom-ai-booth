DROP TABLE IF EXISTS photos;
CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  original_url TEXT NOT NULL,
  result1_url TEXT,
  result2_url TEXT,
  result3_url TEXT,
  share_count INTEGER DEFAULT 0,
  mascot_name TEXT,
  provider_name TEXT,
  provider_phone TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
