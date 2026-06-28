CREATE TABLE IF NOT EXISTS virtual_pins (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  pin_number   SMALLINT NOT NULL CHECK (pin_number >= 0 AND pin_number <= 255),
  label        VARCHAR(100) NOT NULL DEFAULT '',
  direction    VARCHAR(10) NOT NULL DEFAULT 'read',
  data_type    VARCHAR(10) NOT NULL DEFAULT 'number',
  unit         VARCHAR(20) DEFAULT '',
  min_value    DECIMAL(12,4) DEFAULT 0,
  max_value    DECIMAL(12,4) DEFAULT 1023,
  last_value   TEXT,
  last_updated TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (device_id, pin_number)
);

CREATE INDEX IF NOT EXISTS idx_vpin_device ON virtual_pins(device_id);
