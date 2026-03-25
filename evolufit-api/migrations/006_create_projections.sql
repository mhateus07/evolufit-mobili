CREATE TABLE IF NOT EXISTS tdee_calibrations (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calculated_at         TIMESTAMPTZ DEFAULT NOW(),
    bmr_formula_kcal      NUMERIC(8,2) NOT NULL,
    activity_multiplier   NUMERIC(4,3) NOT NULL,
    tdee_formula_kcal     NUMERIC(8,2) NOT NULL,
    tdee_calibrated_kcal  NUMERIC(8,2),
    calibration_weeks     INT DEFAULT 0,
    confidence_score      NUMERIC(4,3) DEFAULT 0,
    data_points_used      INT DEFAULT 0,
    UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS projections (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generated_at          TIMESTAMPTZ DEFAULT NOW(),
    horizon_weeks         INT NOT NULL DEFAULT 12,
    current_weight_kg     NUMERIC(5,2) NOT NULL,
    conservative_scenario JSONB NOT NULL,
    current_scenario      JSONB NOT NULL,
    optimized_scenario    JSONB NOT NULL,
    adherence_score       NUMERIC(5,2) NOT NULL DEFAULT 0,
    is_cold_start         BOOLEAN DEFAULT TRUE,
    llm_explanation       TEXT,
    expires_at            TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projections_user ON projections(user_id, generated_at DESC);

CREATE TABLE IF NOT EXISTS adherence_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score_date      DATE NOT NULL,
    overall_score   NUMERIC(5,2) NOT NULL,
    weight_logged   BOOLEAN DEFAULT FALSE,
    nutrition_score NUMERIC(5,2),
    training_score  NUMERIC(5,2),
    detail          JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, score_date)
);
