CREATE TABLE IF NOT EXISTS user_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    birth_date      DATE NOT NULL,
    sex             VARCHAR(10) NOT NULL CHECK (sex IN ('male', 'female')),
    height_cm       NUMERIC(5,2) NOT NULL,
    goal            VARCHAR(20) NOT NULL CHECK (goal IN ('lose_fat', 'gain_muscle', 'maintain', 'recomposition')),
    activity_level  VARCHAR(20) NOT NULL CHECK (activity_level IN ('sedentary','light','moderate','active','very_active')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id)
);
