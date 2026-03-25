CREATE TABLE IF NOT EXISTS marmitas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    calories        INT NOT NULL,
    protein_g       NUMERIC(6,2) NOT NULL,
    carbs_g         NUMERIC(6,2) NOT NULL,
    fat_g           NUMERIC(6,2) NOT NULL,
    price_cents     INT NOT NULL,
    is_available    BOOLEAN DEFAULT TRUE,
    tags            TEXT[],
    image_url       TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marmita_suggestions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    marmita_id      UUID NOT NULL REFERENCES marmitas(id),
    suggested_at    TIMESTAMPTZ DEFAULT NOW(),
    trigger_reason  VARCHAR(50) NOT NULL,
    gap_protein_g   NUMERIC(6,2),
    gap_calories    INT,
    was_viewed      BOOLEAN DEFAULT FALSE,
    was_purchased   BOOLEAN DEFAULT FALSE
);
