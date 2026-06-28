CREATE TABLE IF NOT EXISTS widgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         VARCHAR(30) NOT NULL,
  pin_number   SMALLINT,
  label        VARCHAR(100) DEFAULT '',
  config       JSONB NOT NULL DEFAULT '{}',
  grid_x       SMALLINT NOT NULL DEFAULT 0,
  grid_y       SMALLINT NOT NULL DEFAULT 0,
  grid_w       SMALLINT NOT NULL DEFAULT 3,
  grid_h       SMALLINT NOT NULL DEFAULT 2,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_widgets_device ON widgets(device_id);
CREATE INDEX IF NOT EXISTS idx_widgets_user ON widgets(user_id);
