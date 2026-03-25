# EvoluFit

App mobile de nutrição e evolução física com projeção de composição corporal baseada em IA.

---

## Visão Geral

O EvoluFit permite que o usuário registre peso, alimentação e treinos diários e receba projeções personalizadas de composição corporal (massa gorda e massa magra) em três cenários: conservador, atual e otimizado. O engine de cálculo é 100% determinístico — a IA é usada apenas para gerar textos explicativos.

---

## Estrutura do Repositório

```
app_Evolufit/
├── evolufit-api/      # Backend (Node.js + Fastify + TypeScript)
├── evolufit-mobile/   # App mobile (React Native + Expo)
└── docs/              # PRD e planejamento técnico
```

---

## Stack

### Backend — `evolufit-api`
| Tecnologia | Uso |
|---|---|
| Node.js + Fastify | Servidor HTTP |
| TypeScript + Zod | Tipagem e validação |
| PostgreSQL + pg | Banco de dados |
| JWT + bcryptjs | Autenticação |
| Nodemailer | Envio de e-mails (recuperação de senha) |
| Firebase Admin | Push notifications (FCM) |

### Mobile — `evolufit-mobile`
| Tecnologia | Uso |
|---|---|
| React Native + Expo SDK 54 | App iOS/Android |
| React Navigation | Navegação entre telas |
| Zustand | Gerenciamento de estado |
| Axios | Requisições HTTP |
| Expo Notifications | Push notifications |

---

## Funcionalidades

- **Autenticação** — cadastro, login, recuperação de senha por e-mail (código 6 dígitos)
- **Onboarding** — 4 passos: perfil → metas nutricionais → plano de treino → peso inicial
- **Dashboard** — peso atual, macros do dia, gráfico de evolução de peso
- **Log diário** — registro de peso, refeições e treinos
- **Histórico** — visualização de registros de peso, alimentação e treino
- **Projeção EvoluFit** — 3 cenários com faixas de peso, gordura e massa magra
- **Marmitas** — catálogo de refeições com sugestão por gap nutricional
- **Planos** — edição de metas nutricionais e plano de treino
- **Notificações push** — lembretes via FCM

---

## Engine de Projeção

O motor de cálculo roda inteiramente no backend com os seguintes módulos:

| Módulo | Função |
|---|---|
| `tdee.calculator.ts` | TDEE via Mifflin-St Jeor + fator de atividade |
| `calibration.ts` | Calibração progressiva com dados reais (lerp) |
| `scenario.builder.ts` | Cenários conservador (70%), atual e otimizado (90%) |
| `adherence.scorer.ts` | Score 0–100: peso (20%), nutrição (50%), treino (30%) |
| `body.composition.ts` | Estimativa de gordura e massa magra |
| `cold.start.ts` | Ativado com menos de 3 pesos ou 7 dias de alimentação |

---

## Rodando Localmente

### Pré-requisitos
- Node.js 20+
- PostgreSQL (ou Docker)
- Expo Go (iPhone/Android) ou emulador

### Backend

```bash
cd evolufit-api
cp .env.example .env
# Preencha as variáveis no .env
npm install
npm run dev       # Inicia na porta 3333
```

### Mobile

```bash
cd evolufit-mobile
npm install
npx expo start --clear
```

Escaneie o QR Code com o Expo Go ou pressione `i` para iOS / `a` para Android.

---

## Variáveis de Ambiente (Backend)

Veja o arquivo [`evolufit-api/.env.example`](evolufit-api/.env.example) para todas as variáveis necessárias.

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL |
| `JWT_SECRET` | Chave secreta para tokens JWT |
| `SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS` | Configuração de e-mail |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Credenciais FCM (opcional em dev) |

---

## Deploy (Produção)

O backend roda em VPS com PM2:

```bash
npm run build
rsync -avz dist/ root@<ip>:/var/www/evolufit-api/dist/
pm2 restart evolufit-api --update-env
```

---

## Documentação

- [`docs/PRD-projecao-evolufit.md`](docs/PRD-projecao-evolufit.md) — Requisitos do produto
- [`docs/planejamento-tecnico.md`](docs/planejamento-tecnico.md) — Arquitetura e decisões técnicas
- [`docs/progresso-desenvolvimento.md`](docs/progresso-desenvolvimento.md) — Status de desenvolvimento
