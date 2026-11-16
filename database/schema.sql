CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  content TEXT NOT NULL CHECK (char_length(content) <= 50000),
  document_url TEXT,
  document_name VARCHAR(180),
  access_type VARCHAR(10) NOT NULL DEFAULT 'free' CHECK (access_type IN ('free','paid')),
  price NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS access_type VARCHAR(10) NOT NULL DEFAULT 'free';
ALTER TABLE catalogs ADD COLUMN IF NOT EXISTS price NUMERIC(12,2);
CREATE INDEX IF NOT EXISTS catalogs_created_at_idx ON catalogs (created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  key VARCHAR(200) PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_limits_window_idx ON rate_limits (window_started_at);

CREATE TABLE IF NOT EXISTS site_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
  whatsapp_url TEXT,
  telegram_url TEXT,
  tiktok_url TEXT,
  purchase_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS purchase_url TEXT;
INSERT INTO site_settings (id) VALUES (TRUE) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS catalog_access_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_id UUID NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  stage SMALLINT NOT NULL DEFAULT 0 CHECK (stage IN (0,1,2)),
  whatsapp_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  whatsapp_completed_at TIMESTAMPTZ,
  tiktok_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS catalog_access_sessions_created_idx ON catalog_access_sessions(created_at);
