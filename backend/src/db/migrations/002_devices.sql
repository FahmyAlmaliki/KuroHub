CREATE TABLE IF NOT EXISTS devices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  description      TEXT,
  location         VARCHAR(255),
  group_name       VARCHAR(100),
  firmware_version VARCHAR(50),
  api_key          VARCHAR(128) UNIQUE NOT NULL,
  status           VARCHAR(10) DEFAULT 'offline',
  last_seen        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_api_key ON devices(api_key);
