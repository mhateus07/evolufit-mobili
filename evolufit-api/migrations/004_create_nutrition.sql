CREATE TABLE IF NOT EXISTS nutrition_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calories_target INT NOT NULL,
    protein_g       NUMERIC(6,2) NOT NULL,
    carbs_g         NUMERIC(6,2) NOT NULL,
    fat_g           NUMERIC(6,2) NOT NULL,
    is_active       BOOLEAN DEFAULT TRUE,
    valid_from      DATE NOT NULL,
    valid_until     DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS food_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    logged_date     DATE NOT NULL,
    calories_actual INT,
    protein_g       NUMERIC(6,2),
    carbs_g         NUMERIC(6,2),
    fat_g           NUMERIC(6,2),
    source          VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual','api','barcode')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, logged_date)
);

CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, logged_date DESC);
