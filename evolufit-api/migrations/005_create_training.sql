CREATE TABLE IF NOT EXISTS training_plans (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sessions_per_week INT NOT NULL CHECK (sessions_per_week BETWEEN 1 AND 7),
    avg_duration_min  INT NOT NULL,
    intensity         VARCHAR(10) NOT NULL CHECK (intensity IN ('low','moderate','high')),
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trained_at      TIMESTAMPTZ NOT NULL,
    duration_min    INT,
    intensity       VARCHAR(10) CHECK (intensity IN ('low','moderate','high')),
    calories_burned INT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_logs_user_date ON training_logs(user_id, trained_at DESC);
