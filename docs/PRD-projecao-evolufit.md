# PRD — Sistema de Projeção de Evolução Física (EvoluFit)

## 1. Objetivo do produto
Criar um sistema que analisa os dados de dieta, treino e evolução corporal do usuário e gera projeções de resultado físico nas próximas semanas, ajudando o usuário a entender como suas escolhas impactam o resultado.

Três objetivos principais:
- Aumentar aderência à dieta
- Aumentar retenção no app
- Integrar recomendações de marmitas EvoluFit

---

## 2. Nome da feature
**Projeção EvoluFit**

---

## 3. Problema que resolve
Usuários frequentemente não sabem se estão evoluindo bem:
- "Será que minha dieta está funcionando?"
- "Quanto peso eu posso perder nesse ritmo?"
- "Estou perdendo gordura ou músculo?"

A feature responde essas perguntas com dados.

---

## 4. Métricas de sucesso
- Retenção semanal do app
- Número de check-ins de peso
- Frequência de registro alimentar
- Número de conversas com IA
- Compras de marmitas sugeridas

---

## 5. Dados de entrada necessários

### Perfil
- Peso atual, altura, idade, sexo
- Objetivo: perder gordura | recomposição | hipertrofia

### Metabólicos calculados
- TMB (taxa metabólica basal)
- TDEE (gasto energético total estimado)

### Comportamentais
- Calorias médias ingeridas
- Proteína média ingerida
- Frequência de treino semanal
- Aderência à dieta
- Passos médios ou nível de atividade

### Evolução
- Histórico de peso
- Histórico de BF estimado
- Fotos opcionais
- Medidas corporais opcionais

*Sem histórico, o sistema usa apenas estimativas metabólicas (cold start).*

---

## 6. Outputs do sistema

### Peso projetado
Faixa estimada em 4, 8 e 12 semanas. Ex: 94 kg hoje → 93,1–93,8 kg em 4 semanas.

### Tendência de gordura corporal
Redução gradual | estável | possível aumento

### Risco de perda muscular
- Baixo risco | risco moderado | alto risco
- Baseado em: proteína, déficit calórico, treino

### Score de aderência
Índice 0–100 baseado em:
- Registro alimentar
- Frequência de treino
- Variação calórica

---

## 7. Motor de projeção

### Fórmula base
- TMB: Mifflin-St Jeor
- TDEE: TMB × fator de atividade
- Mudança semanal: déficit ÷ 7700 kcal/kg

### Ajustes
- Proteína baixa → aumenta risco de perda muscular
- Treino inexistente → reduz potencial de recomposição

---

## 8. Três cenários
- **Conservador:** 70% de aderência
- **Atual:** comportamento real do usuário
- **Otimizado:** 90% aderência + treino ideal

---

## 9. Interface no app

| Bloco | Conteúdo |
|---|---|
| 1 — Resumo atual | Peso, BF estimado, aderência, treinos semanais |
| 2 — Gráfico de projeção | Linha do tempo 4/8/12 semanas com faixa de peso |
| 3 — Cenários | Atual vs. otimizado lado a lado |
| 4 — Fatores de impacto | O que está ajudando e o que está limitando |
| 5 — Recomendação da IA | Texto explicativo personalizado |

---

## 10. Simulador de cenários
O usuário altera:
- Treinos por semana
- Proteína diária
- Aderência à dieta

O sistema recalcula em tempo real.

---

## 11. Integração com marmitas EvoluFit
Quando o sistema detecta gap nutricional:
> "Para atingir sua meta de proteína hoje recomendamos a marmita EvoluFit Frango + Arroz."

Botão: **Pedir marmita** → converte engajamento em venda.

---

## 12. IA explicativa
A IA **não calcula** — ela **interpreta**.

Recebe: dados do usuário + resultado da projeção + alertas nutricionais
Gera: explicação simples em linguagem natural

---

## 13. MVP
Primeira versão inclui apenas:
- Perfil metabólico
- Registro alimentar
- Registro de peso
- Projeção de peso em 4 semanas
- Recomendação nutricional básica
