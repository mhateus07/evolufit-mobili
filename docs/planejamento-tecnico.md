# Planejamento Técnico — EvoluFit Projeção

## Arquitetura Geral

```
[React Native App]
        |
[API Gateway — Fastify]
        |
  ______|_______________________
  |            |               |
[Projection  [Nutrition    [Notification
  Engine]     Module]        Service]
  |            |               |
  |____________|_______________|
               |
          [PostgreSQL]
               |
          [LLM API]  ← só interpreta, nunca calcula
```

**Regra fundamental:** a LLM nunca faz matemática. Recebe apenas resultados calculados e gera texto explicativo.

---

## Estrutura de Pastas

### Backend (Node.js + Fastify)

```
evolufit-api/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── llm.ts
│   ├── modules/
│   │   ├── users/
│   │   │   ├── user.repository.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.routes.ts
│   │   │   └── user.schema.ts
│   │   ├── biometrics/
│   │   │   ├── biometrics.repository.ts
│   │   │   ├── biometrics.service.ts
│   │   │   ├── biometrics.routes.ts
│   │   │   └── biometrics.schema.ts
│   │   ├── nutrition/
│   │   │   ├── nutrition.repository.ts
│   │   │   ├── nutrition.service.ts
│   │   │   ├── nutrition.routes.ts
│   │   │   └── nutrition.schema.ts
│   │   ├── training/
│   │   │   ├── training.repository.ts
│   │   │   ├── training.service.ts
│   │   │   ├── training.routes.ts
│   │   │   └── training.schema.ts
│   │   ├── projection/
│   │   │   ├── projection.repository.ts
│   │   │   ├── projection.service.ts       # orquestrador + cache
│   │   │   ├── projection.routes.ts
│   │   │   ├── projection.schema.ts
│   │   │   └── engine/
│   │   │       ├── tdee.calculator.ts      # Mifflin-St Jeor + fator atividade
│   │   │       ├── calibration.ts          # calibração com dados reais
│   │   │       ├── scenario.builder.ts     # 3 cenários com faixas biológicas
│   │   │       ├── adherence.scorer.ts     # score 0-100
│   │   │       ├── body.composition.ts     # estimativa gordura/massa magra
│   │   │       └── cold.start.ts           # lógica para usuários sem histórico
│   │   ├── marmitas/
│   │   │   ├── marmita.repository.ts
│   │   │   ├── marmita.service.ts
│   │   │   ├── marmita.routes.ts
│   │   │   └── marmita.schema.ts
│   │   └── notifications/
│   │       ├── notification.service.ts
│   │       ├── notification.routes.ts
│   │       └── events/
│   │           ├── nutrition.gap.event.ts
│   │           ├── goal.milestone.event.ts
│   │           └── weekly.summary.event.ts
│   ├── shared/
│   │   ├── types/
│   │   │   ├── projection.types.ts
│   │   │   ├── nutrition.types.ts
│   │   │   └── user.types.ts
│   │   ├── utils/
│   │   │   ├── date.utils.ts
│   │   │   └── math.utils.ts
│   │   └── middleware/
│   │       ├── auth.middleware.ts
│   │       └── error.handler.ts
│   └── app.ts
├── migrations/
├── seeds/
└── tests/
    ├── unit/engine/
    └── integration/
```

### Mobile (React Native)

```
evolufit-mobile/
├── src/
│   ├── screens/
│   │   ├── projection/
│   │   │   ├── ProjectionDashboard.tsx
│   │   │   ├── ProjectionChart.tsx
│   │   │   ├── ScenarioSelector.tsx
│   │   │   └── MarmitaSuggestions.tsx
│   │   ├── biometrics/
│   │   │   └── WeightLogScreen.tsx
│   │   └── nutrition/
│   │       └── FoodLogScreen.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── projection.api.ts
│   │   └── nutrition.api.ts
│   ├── hooks/
│   │   ├── useProjection.ts
│   │   ├── useAdherenceScore.ts
│   │   └── useNutritionGap.ts
│   ├── store/
│   │   ├── projection.store.ts
│   │   └── user.store.ts
│   └── components/
│       ├── RangeBand.tsx
│       ├── AdherenceGauge.tsx
│       └── NutritionGapAlert.tsx
```

---

## Schema do Banco de Dados

### Ordem de migrations (dependências de FK)
```
001_create_users.sql
002_create_user_profiles.sql
003_create_weight_logs.sql
004_create_nutrition_plans.sql
005_create_food_logs.sql
006_create_training_plans.sql
007_create_training_logs.sql
008_create_tdee_calibrations.sql
009_create_projections.sql
010_create_adherence_scores.sql
011_create_marmitas.sql
012_create_marmita_suggestions.sql
013_create_push_tokens.sql
014_create_notifications_sent.sql
015_create_indexes.sql
```

### Tabelas principais

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_profiles (
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

CREATE TABLE weight_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight_kg       NUMERIC(5,2) NOT NULL,
    body_fat_pct    NUMERIC(4,2),
    muscle_mass_kg  NUMERIC(5,2),
    notes           TEXT,
    measured_at     TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_weight_logs_user_date ON weight_logs(user_id, measured_at DESC);

CREATE TABLE nutrition_plans (
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

CREATE TABLE food_logs (
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
CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, logged_date DESC);

CREATE TABLE training_plans (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sessions_per_week INT NOT NULL CHECK (sessions_per_week BETWEEN 1 AND 7),
    avg_duration_min  INT NOT NULL,
    intensity         VARCHAR(10) NOT NULL CHECK (intensity IN ('low','moderate','high')),
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE training_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trained_at      TIMESTAMPTZ NOT NULL,
    duration_min    INT,
    intensity       VARCHAR(10) CHECK (intensity IN ('low','moderate','high')),
    calories_burned INT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_training_logs_user_date ON training_logs(user_id, trained_at DESC);
```

### Tabelas do motor de projeção

```sql
-- TDEE calibrado (UPSERT — sempre 1 registro por usuário)
CREATE TABLE tdee_calibrations (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calculated_at         TIMESTAMPTZ DEFAULT NOW(),
    bmr_formula_kcal      NUMERIC(8,2) NOT NULL,
    activity_multiplier   NUMERIC(4,3) NOT NULL,
    tdee_formula_kcal     NUMERIC(8,2) NOT NULL,
    tdee_calibrated_kcal  NUMERIC(8,2),
    calibration_weeks     INT DEFAULT 0,
    confidence_score      NUMERIC(4,3),         -- 0.0 a 1.0
    data_points_used      INT DEFAULT 0,
    UNIQUE (user_id)
);

-- Resultado dos 3 cenários (JSONB para flexibilidade)
CREATE TABLE projections (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    generated_at          TIMESTAMPTZ DEFAULT NOW(),
    horizon_weeks         INT NOT NULL DEFAULT 12,
    current_weight_kg     NUMERIC(5,2) NOT NULL,
    conservative_scenario JSONB NOT NULL,
    current_scenario      JSONB NOT NULL,
    optimized_scenario    JSONB NOT NULL,
    adherence_score       NUMERIC(5,2) NOT NULL,
    is_cold_start         BOOLEAN DEFAULT FALSE,
    llm_explanation       TEXT,
    expires_at            TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_projections_user ON projections(user_id, generated_at DESC);

CREATE TABLE adherence_scores (
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
```

### Estrutura do JSONB dos cenários
```json
{
  "weeks": [
    {
      "week": 1,
      "date": "2026-03-17",
      "weight_min_kg": 79.2,
      "weight_max_kg": 79.8,
      "weight_expected_kg": 79.5,
      "fat_mass_min_kg": 18.1,
      "fat_mass_max_kg": 18.6,
      "lean_mass_min_kg": 61.0,
      "lean_mass_max_kg": 61.4,
      "weekly_deficit_kcal": -500,
      "cumulative_deficit_kcal": -500
    }
  ],
  "adherence_assumption": 0.75,
  "goal_reached_week": 10
}
```

### Tabelas de marmitas e notificações

```sql
CREATE TABLE marmitas (
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

CREATE TABLE marmita_suggestions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    marmita_id      UUID NOT NULL REFERENCES marmitas(id),
    suggested_at    TIMESTAMPTZ DEFAULT NOW(),
    trigger_reason  VARCHAR(50) NOT NULL,  -- 'protein_gap' | 'calorie_gap' | 'weekly_plan'
    gap_protein_g   NUMERIC(6,2),
    gap_calories    INT,
    was_viewed      BOOLEAN DEFAULT FALSE,
    was_purchased   BOOLEAN DEFAULT FALSE
);

CREATE TABLE push_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token           TEXT NOT NULL,
    platform        VARCHAR(10) NOT NULL CHECK (platform IN ('ios','android')),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (token)
);

CREATE TABLE notifications_sent (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type      VARCHAR(50) NOT NULL,
    title           TEXT NOT NULL,
    body            TEXT NOT NULL,
    data            JSONB,
    sent_at         TIMESTAMPTZ DEFAULT NOW(),
    read_at         TIMESTAMPTZ
);
CREATE INDEX idx_notifications_user ON notifications_sent(user_id, sent_at DESC);
```

---

## Motor de Cálculo — Algoritmos

### 1. TDEE Calculator (`tdee.calculator.ts`)

```typescript
// Mifflin-St Jeor
// Homem: (10 * peso) + (6.25 * altura) - (5 * idade) + 5
// Mulher: (10 * peso) + (6.25 * altura) - (5 * idade) - 161
calculateBMR(weight_kg, height_cm, age, sex) -> number

// sedentary:1.2 | light:1.375 | moderate:1.55 | active:1.725 | very_active:1.9
getActivityMultiplier(level) -> number

calculateTDEE(bmr, multiplier) -> number

// lose_fat: -500 | gain_muscle: +300 | maintain: 0 | recomposition: -200
getCalorieTarget(tdee, goal) -> { target, surplus_deficit }
```

### 2. Calibration Engine (`calibration.ts`)

O módulo mais crítico para precisão a longo prazo:

```typescript
// Algoritmo de calibração progressiva:
// 1. TDEE_real = avgCalories - (deltaWeight_kg * 7700 / dias)
// 2. confidence = min(weeks_of_data / 8, 1.0)  → 100% em 8 semanas
// 3. TDEE_final = lerp(TDEE_formula, TDEE_real, confidence)
//    (começa 100% na fórmula, migra para dados reais gradualmente)
calibrateTDEE(params: CalibrationInput) -> CalibratedTDEE

// 'insufficient' | 'low' | 'medium' | 'high'
// < 2 semanas: insufficient | 2-4: low | 4-8: medium | > 8: high
assessCalibrationQuality(dataPoints, weeksOfData) -> CalibrationQuality
```

### 3. Scenario Builder (`scenario.builder.ts`)

```typescript
buildConservativeScenario(input) -> WeeklyProjection[]
// adherence_factor = 0.70

buildCurrentScenario(input) -> WeeklyProjection[]
// adherence_factor = adherence_score / 100 (dados reais)

buildOptimizedScenario(input) -> WeeklyProjection[]
// adherence_factor = 0.90 + bônus de treino ideal

// Variância biológica aumenta com o tempo:
// week 1: ±0.5kg | week 4: ±0.8kg | week 8: ±1.2kg | week 12: ±1.8kg
applyBiologicalVariance(expected_weight, week_number) -> { min, max }
```

### 4. Adherence Scorer (`adherence.scorer.ts`)

```typescript
// Pesos dos componentes:
// 20% — registro de peso (frequência de pesagem, esperado 2x/semana)
// 50% — aderência nutricional (% dias dentro de ±10% do plano)
// 30% — aderência ao treino (realizados / planejados)
// Dias sem registro = 0 (penaliza ausência)
calculateAdherenceScore(userId, windowDays = 28) -> AdherenceScore
```

### 5. Cold Start Handler (`cold.start.ts`)

```typescript
// Ativado quando: weight_logs < 3 OU food_logs < 7 dias
// Usa apenas perfil biométrico (sem dados históricos)
// confidence_score = 0.1 | faixa ±2kg | is_cold_start = true
// Exibe: "Sua projeção ficará mais precisa nas próximas 2 semanas"
handleColdStart(userProfile) -> ColdStartProjection
```

### 6. Body Composition Estimator (`body.composition.ts`)

```typescript
// Quando não há bioimpedância: usa fórmula de estimativa (Gallagher et al.)
estimateBodyComposition(weight_kg, sex, age, activity_level) -> BodyComposition

// lose_fat: perde 1kg gordura para cada 0.85kg total
// gain_muscle: ganha 0.3kg músculo para cada 1kg total
// recomposition: -0.5kg gordura/mês, +0.3kg músculo/mês
projectLeanMassChange(scenario, goal) -> LeanMassProjection
```

---

## Endpoints da API

```
# Autenticação
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout

# Perfil
GET    /users/me
PATCH  /users/me
GET    /users/me/profile
PUT    /users/me/profile

# Biometria
POST   /biometrics/weight
GET    /biometrics/weight?from=&to=&limit=
DELETE /biometrics/weight/:id

# Nutrição
GET    /nutrition/plan
PUT    /nutrition/plan
POST   /nutrition/log
GET    /nutrition/log?from=&to=
GET    /nutrition/gap/today        ← gap nutricional do dia atual

# Treino
GET    /training/plan
PUT    /training/plan
POST   /training/log
GET    /training/log

# Projeção (módulo central)
GET    /projection/current          ← retorna cache ou recalcula se expirado
POST   /projection/recalculate      ← força recálculo imediato
GET    /projection/adherence        ← score detalhado com breakdown
GET    /projection/calibration-status

# Marmitas
GET    /marmitas?tag=high_protein&available=true
GET    /marmitas/suggestions        ← baseado no gap nutricional
POST   /marmitas/suggestions/:id/view
POST   /marmitas/suggestions/:id/purchase

# Notificações
POST   /notifications/token
DELETE /notifications/token
GET    /notifications?unread=true&limit=20
PATCH  /notifications/:id/read
PATCH  /notifications/read-all
```

---

## Notificações — Eventos e Triggers

| Evento | Trigger | Mensagem |
|---|---|---|
| `nutrition_gap` | Gap proteína > 20g às 18h, se ainda não atingiu meta | "Faltam {X}g de proteína hoje. Temos uma marmita perfeita para você." |
| `goal_milestone` | Peso cruzou 25%, 50%, 75% ou 100% da meta | "Você atingiu {X}% da sua meta! Projeção atualizada." |
| `weekly_summary` | Todo domingo às 19h (cron) | "Seu resumo semanal. Score de aderência: {X}/100" |
| `no_weight_log` | 4 dias sem registrar peso (cron diário 8h) | "Não esqueça de se pesar! Seus dados mantêm a projeção precisa." |
| `cold_start_complete` | Após 14 dias com dados suficientes | "Sua projeção agora está personalizada com seus dados reais!" |

---

## Grafo de Dependências entre Módulos

```
users
  └── biometrics
  └── nutrition
        └── marmitas (sugestão baseada em gap)
  └── training
        |
        └── projection/engine
              ├── tdee.calculator     (usa: biometrics, user_profiles)
              ├── calibration         (usa: biometrics + nutrition)
              ├── adherence.scorer    (usa: biometrics + nutrition + training)
              ├── cold.start          (usa: user_profiles apenas)
              ├── body.composition    (usa: biometrics)
              └── scenario.builder   (usa: todos acima)
                    |
                    └── projection.service (orquestra + LLM)
                          |
                          └── notifications (consome eventos da projeção)
```

---

## Ordem de Implementação

### Fase 1 — Fundação (semanas 1-2)
Setup completo + módulos CRUD base.

1. Setup Fastify + TypeScript + Zod + JWT + sistema de migrations
2. Módulo `users`: registro, login, JWT refresh
3. Módulo `biometrics`: CRUD de peso com série temporal
4. Módulo `nutrition`: plano + logs diários + endpoint de gap
5. Módulo `training`: plano + logs de sessão
6. Testes de integração dos endpoints CRUD

### Fase 2 — Motor de Cálculo (semanas 3-4)
Implementar e testar unitariamente cada função de forma isolada — sem banco, sem HTTP, só funções puras.

1. `tdee.calculator.ts`: BMR + TDEE + metas calóricas (com testes extensivos)
2. `adherence.scorer.ts`: score 0-100 com testes por componente
3. `cold.start.ts`: detecção + projeção estimada para novos usuários
4. `body.composition.ts`: estimativa de composição corporal
5. `scenario.builder.ts`: 3 cenários + faixas biológicas
6. `calibration.ts`: calibração progressiva lerp (mais complexo — por último)

### Fase 3 — API de Projeção + Cache (semana 5)
Endpoint de projeção funcionando end-to-end.

1. `projection.repository.ts`: upsert de calibração, save de projeções
2. `projection.service.ts`: orquestração + cache (expires_at 24h)
3. `projection.routes.ts`: endpoints GET/POST
4. Integração LLM: enviar dados calculados, receber texto explicativo
5. Invalidação de cache: novo peso registrado → recálculo assíncrono via job queue

### Fase 4 — Marmitas (semana 6)
Monetização integrada ao gap nutricional.

1. Schema + seed do catálogo de marmitas
2. `marmita.service.ts`: algoritmo de matching por gap nutricional
3. Endpoint de sugestões + lógica de trigger
4. Rastreamento de view/purchase

### Fase 5 — Notificações Push (semana 7)
Engajamento automatizado.

1. Integração com FCM ou Expo Notifications
2. `notification.service.ts`: envio + histórico
3. Eventos: nutrition_gap, goal_milestone
4. Cron jobs: weekly_summary, no_weight_log reminder

### Mobile (paralelo ao backend)
- **Semana 2-3:** Onboarding (perfil, metas, dados iniciais)
- **Semana 3-4:** Telas de log diário (peso, alimentação, treino)
- **Semana 5-6:** Dashboard com gráfico de faixas + 3 cenários
- **Semana 6:** Tela de sugestões de marmitas
- **Semana 7:** Integração com push notifications

---

## Decisões Técnicas

### Cache de Projeções
- `expires_at = NOW() + 24h` por padrão
- Invalidação imediata quando novo peso é registrado
- Recálculo assíncrono em background via `pg-boss` (job queue em PostgreSQL — sem Redis)
- Não bloqueia a resposta do POST de peso

### LLM — Contrato de Dados
A LLM recebe apenas dados já calculados (nunca dados brutos):

```json
{
  "user_goal": "lose_fat",
  "current_weight_kg": 82.5,
  "adherence_score": 73,
  "conservative_goal_week": 14,
  "current_goal_week": 10,
  "optimized_goal_week": 8,
  "is_cold_start": false,
  "calibration_quality": "medium",
  "main_gap": "protein -25g/day"
}
```

**Prompt de sistema:**
> "Você é um coach de saúde. Com base nos dados calculados pelo sistema, escreva 2-3 frases motivacionais e uma recomendação prática. Não invente números diferentes dos fornecidos."

### Cache LLM Separado
Só rechama a LLM se o cenário mudou > 5% — reduz custo significativamente.

**Fallback:** se a API LLM estiver fora do ar, exibe texto template estático baseado no cenário.

### Validação de Dados Impossíveis
O engine rejeita entradas fisicamente impossíveis:
- Perda > 1.5kg/semana → alertar usuário
- Ganho de músculo > 0.5kg/mês → cap automático com nota
- Calorias < 500 kcal/dia → sinalizar como possível erro de log

---

## Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Usuário não registra dados por semanas | Projeção fica desatualizada | Notificação `no_weight_log` + badge "projeção desatualizada" |
| Sub-reporte alimentar | Calibração errada | Comparar variação real vs. teórica — se discrepância > 20%, sinalizar |
| Faixa muito larga no cold start | Desengajamento | Comunicar que a faixa melhora com mais dados |
| LLM fora do ar | Texto explicativo quebra | Fallback para texto template estático |
| Custo alto de chamadas LLM | Custo operacional | Cache separado do engine — só rechamar se cenário mudou > 5% |
| Previsão muito errada | Usuário perde confiança | Sempre exibir faixas (não números únicos) + indicador de confiança |
