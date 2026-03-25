CREATE TABLE IF NOT EXISTS weight_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight_kg       NUMERIC(5,2) NOT NULL,
    body_fat_pct    NUMERIC(4,2),
    muscle_mass_kg  NUMERIC(5,2),
    notes           TEXT,
    measured_at     TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, measured_at DESC);
