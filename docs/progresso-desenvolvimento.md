# Progresso de Desenvolvimento — EvoluFit

**Última atualização:** 10/03/2026
**Status geral:** Backend completo — iniciando app mobile

---

## Stack utilizada

| Camada | Tecnologia |
|---|---|
| Backend | Node.js + Fastify + TypeScript |
| Banco de dados | PostgreSQL 16 (Docker, porta 5433) |
| Autenticação | JWT (@fastify/jwt) |
| Validação | Zod |
| Hash de senha | bcryptjs |
| Push notifications | Firebase Admin SDK (modo simulado em dev) |
| Mobile | React Native (próxima fase) |

---

## Ambiente de desenvolvimento

| Ferramenta | Status | Detalhe |
|---|---|---|
| VS Code | ✅ | Editor principal |
| Node.js | ✅ | v24.11.1 |
| JDK 17 | ✅ | Temurin 17.0.18 |
| Android Studio | ✅ | Emulador Medium Phone API 36 rodando |
| Docker | ✅ | v29.2.1 |
| PostgreSQL | ✅ | Container `evolufit-db` porta 5433 |
| TablePlus | ✅ | Conectado ao banco |
| Insomnia | ✅ | Collection `EvoluFit API` configurada |

### Subir o ambiente
```bash
# 1. Subir o banco (se não estiver rodando)
docker start evolufit-db

# 2. Subir o servidor
cd ~/Documents/app_Evolufit/evolufit-api
npm run dev

# 3. Popular marmitas (apenas uma vez)
npm run seed
```

---

## Estrutura do projeto

```
app_Evolufit/
├── docs/
│   ├── PRD-projecao-evolufit.md         # PRD original do produto
│   ├── planejamento-tecnico.md          # Planejamento técnico completo
│   └── progresso-desenvolvimento.md     # Este arquivo
└── evolufit-api/                        # Backend Node.js
    ├── src/
    │   ├── config/
    │   │   ├── database.ts              # Conexão PostgreSQL
    │   │   ├── env.ts                   # Variáveis de ambiente
    │   │   ├── firebase.ts              # Firebase Admin (push notifications)
    │   │   └── migrate.ts               # Sistema de migrations automático
    │   ├── modules/
    │   │   ├── users/                   # Autenticação + perfil
    │   │   ├── biometrics/              # Registro de peso
    │   │   ├── nutrition/               # Plano + log alimentar + gap
    │   │   ├── training/                # Plano + log de treino
    │   │   ├── projection/              # Motor de projeção
    │   │   │   └── engine/              # Cálculos matemáticos
    │   │   ├── marmitas/                # Catálogo + sugestões
    │   │   └── notifications/           # Push + cron jobs
    │   ├── shared/
    │   │   └── middleware/
    │   │       └── error.handler.ts
    │   ├── app.ts                       # Bootstrap Fastify
    │   └── server.ts                    # Entry point
    ├── migrations/                      # 8 arquivos SQL
    ├── seeds/
    │   └── marmitas.ts                  # 8 marmitas do catálogo
    ├── .env                             # Variáveis locais
    └── package.json
```

---

## Banco de dados — 15 tabelas criadas

| Tabela | Descrição |
|---|---|
| `users` | Usuários cadastrados |
| `user_profiles` | Perfil biométrico (altura, sexo, objetivo, atividade) |
| `weight_logs` | Histórico de peso + % gordura |
| `nutrition_plans` | Plano alimentar ativo (metas calóricas + macros) |
| `food_logs` | Registro diário de alimentação |
| `training_plans` | Plano de treino (sessões/semana, intensidade) |
| `training_logs` | Sessões de treino realizadas |
| `tdee_calibrations` | TDEE calibrado progressivamente com dados reais |
| `projections` | Projeções geradas (3 cenários em JSONB) |
| `adherence_scores` | Score de aderência diário (0-100) |
| `marmitas` | Catálogo de marmitas com macros e preço |
| `marmita_suggestions` | Sugestões geradas + rastreamento de conversão |
| `push_tokens` | Tokens FCM dos dispositivos |
| `notifications_sent` | Histórico de notificações enviadas |
| `_migrations` | Controle de migrations executadas |

---

## Endpoints implementados

### Autenticação
| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/auth/register` | Cadastro de usuário |
| POST | `/auth/login` | Login + retorna JWT |

### Usuários
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/users/me` | Dados do usuário autenticado |
| GET | `/users/me/profile` | Perfil biométrico |
| PUT | `/users/me/profile` | Criar ou atualizar perfil |

### Biometria
| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/biometrics/weight` | Registrar peso |
| GET | `/biometrics/weight` | Histórico de peso |
| DELETE | `/biometrics/weight/:id` | Deletar registro |

### Nutrição
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/nutrition/plan` | Plano alimentar ativo |
| PUT | `/nutrition/plan` | Criar ou atualizar plano |
| POST | `/nutrition/log` | Registrar alimentação do dia |
| GET | `/nutrition/log` | Histórico de registros |
| GET | `/nutrition/gap/today` | Gap nutricional do dia atual |

### Treino
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/training/plan` | Plano de treino ativo |
| PUT | `/training/plan` | Criar ou atualizar plano |
| POST | `/training/log` | Registrar sessão de treino |
| GET | `/training/log` | Histórico de treinos |

### Projeção (motor principal)
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/projection/current` | Projeção atual (cache 24h) |
| POST | `/projection/recalculate` | Forçar recálculo |
| GET | `/projection/adherence` | Score de aderência detalhado |
| GET | `/projection/calibration-status` | Status da calibração do TDEE |

### Marmitas
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/marmitas` | Catálogo completo |
| GET | `/marmitas?tag=high_protein` | Filtro por tag |
| GET | `/marmitas/suggestions` | Sugestões por gap nutricional |
| POST | `/marmitas/suggestions/:id/view` | Rastrear visualização |
| POST | `/marmitas/suggestions/:id/purchase` | Rastrear compra |

### Notificações
| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/notifications/token` | Registrar token push |
| DELETE | `/notifications/token` | Remover token |
| GET | `/notifications` | Histórico de notificações |
| PATCH | `/notifications/:id/read` | Marcar como lida |
| PATCH | `/notifications/read-all` | Marcar todas como lidas |
| POST | `/notifications/test` | Disparo manual (dev) |

---

## Motor de projeção — engine

### Arquivos do engine (`src/modules/projection/engine/`)

| Arquivo | Função |
|---|---|
| `tdee.calculator.ts` | Calcula BMR (Mifflin-St Jeor) e TDEE com fator de atividade |
| `calibration.ts` | Calibra TDEE progressivamente com dados reais via interpolação lerp |
| `scenario.builder.ts` | Constrói 3 cenários (conservador/atual/otimizado) com faixas biológicas |
| `adherence.scorer.ts` | Score 0-100: 20% peso + 50% nutrição + 30% treino |
| `body.composition.ts` | Estima gordura/massa magra sem bioimpedância |
| `cold.start.ts` | Detecta usuários sem histórico suficiente |

### Lógica dos cenários
- **Conservador:** 70% de aderência
- **Atual:** % baseada no score real do usuário
- **Otimizado:** 90% de aderência

### Variância biológica por semana
- Semana 1: ±0.5kg | Semana 4: ±0.8kg | Semana 8: ±1.2kg | Semana 12: ±1.8kg

### Calibração do TDEE
```
TDEE_real = avgCalories - (deltaWeight_kg * 7700 / dias)
confidence = min(semanas_de_dados / 8, 1.0)
TDEE_final = lerp(TDEE_formula, TDEE_real, confidence)
```

---

## Notificações — cron jobs

| Evento | Horário | Trigger |
|---|---|---|
| `nutrition_gap` | Todo dia 18h | Gap proteína > 20g |
| `no_weight_log` | Todo dia 8h | Sem peso há 4+ dias |
| `weekly_summary` | Domingo 19h | Resumo semanal automático |

Em desenvolvimento: modo simulado (loga no terminal).
Em produção: configurar `FIREBASE_SERVICE_ACCOUNT_JSON` no `.env`.

---

## Catálogo de marmitas (seed)

| Marmita | Proteína | Calorias | Preço |
|---|---|---|---|
| Frango Grelhado + Arroz Integral + Brócolis | 45g | 480 kcal | R$ 24,90 |
| Carne Moída + Batata Doce + Feijão | 38g | 560 kcal | R$ 27,90 |
| Salmão + Quinoa + Aspargos | 42g | 520 kcal | R$ 34,90 |
| Frango + Macarrão Integral + Tomate | 40g | 580 kcal | R$ 25,90 |
| Omelete de Claras + Legumes + Tapioca | 35g | 380 kcal | R$ 22,90 |
| Tilápia Grelhada + Arroz + Cenoura | 38g | 420 kcal | R$ 23,90 |
| Frango + Arroz de Couve-flor + Abacate | 43g | 440 kcal | R$ 28,90 |
| Carne Bovina Magra + Purê de Batata Doce | 40g | 510 kcal | R$ 31,90 |

---

## Variáveis de ambiente (.env)

```env
PORT=3333
NODE_ENV=development
DATABASE_URL=postgresql://evolufit:evolufit123@localhost:5433/evolufit
JWT_SECRET=evolufit_secret_key_troque_em_producao
JWT_EXPIRES_IN=7d
# FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

---

## Roadmap

### Backend
- [x] Fase 1 — Fundação (auth + CRUD de dados)
- [x] Fase 2 — Motor de cálculo (TDEE, cenários, aderência)
- [x] Fase 3 — API de projeção com cache
- [x] Fase 4 — Marmitas e sugestões inteligentes
- [x] Fase 5 — Notificações push e cron jobs

### Mobile (próxima etapa)
- [ ] Fase 6a — Setup React Native + navegação
- [ ] Fase 6b — Onboarding (cadastro + perfil)
- [ ] Fase 6c — Telas de log diário (peso, alimentação, treino)
- [ ] Fase 6d — Dashboard de projeção com gráfico
- [ ] Fase 6e — Tela de sugestões de marmitas
- [ ] Fase 6f — Integração com notificações push

---

## Observações importantes

1. **Cold start:** Projeção fica com baixa precisão até ter 3+ registros de peso e 7+ dias de alimentação
2. **Calibração:** Melhora progressivamente até 8 semanas de dados (confidence 0 → 1.0)
3. **Cache:** Projeção expira em 24h ou é invalidada quando novo peso é registrado
4. **Firebase:** Em produção adicionar service account JSON no `.env`
5. **Porta do banco:** PostgreSQL rodando na porta **5433** (5432 ocupada por outro projeto)
