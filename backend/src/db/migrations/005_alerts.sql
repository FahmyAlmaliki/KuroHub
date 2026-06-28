CREATE TABLE IF NOT EXISTS alert_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pin_number   SMALLINT NOT NULL,
  name         VARCHAR(255) NOT NULL,
  operator     VARCHAR(5) NOT NULL,
  threshold    DECIMAL(12,4) NOT NULL,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id      UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  device_id    UUID NOT NULL,
  pin_number   SMALLINT NOT NULL,
  value        DECIMAL(12,4) NOT NULL,
  message      TEXT,
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_history_device ON alert_history(device_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_device ON alert_rules(device_id);
