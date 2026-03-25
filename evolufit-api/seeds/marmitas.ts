import { db } from '../src/config/database.js'
import 'dotenv/config'

const marmitas = [
  {
    name: 'Frango Grelhado + Arroz Integral + Brócolis',
    description: 'Clássico fitness com peito de frango, arroz integral e brócolis no vapor',
    calories: 480,
    protein_g: 45,
    carbs_g: 48,
    fat_g: 8,
    price_cents: 2490,
    tags: ['high_protein', 'low_fat', 'fitness'],
  },
  {
    name: 'Carne Moída Temperada + Batata Doce + Feijão',
    description: 'Refeição completa com carne moída, batata doce assada e feijão carioca',
    calories: 560,
    protein_g: 38,
    carbs_g: 65,
    fat_g: 12,
    price_cents: 2790,
    tags: ['high_protein', 'balanced', 'fitness'],
  },
  {
    name: 'Salmão + Quinoa + Aspargos',
    description: 'Proteína nobre com gorduras boas, quinoa e aspargos grelhados',
    calories: 520,
    protein_g: 42,
    carbs_g: 38,
    fat_g: 18,
    price_cents: 3490,
    tags: ['high_protein', 'omega3', 'premium'],
  },
  {
    name: 'Frango + Macarrão Integral + Tomate',
    description: 'Macarrão integral com frango desfiado e molho de tomate caseiro',
    calories: 580,
    protein_g: 40,
    carbs_g: 72,
    fat_g: 9,
    price_cents: 2590,
    tags: ['high_protein', 'high_carb', 'fitness'],
  },
  {
    name: 'Omelete de Claras + Legumes + Tapioca',
    description: 'Omelete de claras com legumes salteados e tapioca recheada',
    calories: 380,
    protein_g: 35,
    carbs_g: 42,
    fat_g: 6,
    price_cents: 2290,
    tags: ['high_protein', 'low_calorie', 'breakfast'],
  },
  {
    name: 'Tilápia Grelhada + Arroz + Cenoura',
    description: 'Peixe branco grelhado com arroz branco e cenoura refogada',
    calories: 420,
    protein_g: 38,
    carbs_g: 45,
    fat_g: 7,
    price_cents: 2390,
    tags: ['high_protein', 'low_fat', 'fitness'],
  },
  {
    name: 'Frango + Arroz de Couve-flor + Abacate',
    description: 'Low carb com frango, arroz de couve-flor e abacate',
    calories: 440,
    protein_g: 43,
    carbs_g: 12,
    fat_g: 22,
    price_cents: 2890,
    tags: ['high_protein', 'low_carb', 'keto'],
  },
  {
    name: 'Carne Bovina Magra + Purê de Batata Doce',
    description: 'Filé de carne bovina magra com purê de batata doce temperado',
    calories: 510,
    protein_g: 40,
    carbs_g: 55,
    fat_g: 10,
    price_cents: 3190,
    tags: ['high_protein', 'balanced', 'premium'],
  },
]

async function seed() {
  console.log('🌱 Inserindo marmitas...')

  for (const m of marmitas) {
    await db.query(
      `INSERT INTO marmitas (name, description, calories, protein_g, carbs_g, fat_g, price_cents, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [m.name, m.description, m.calories, m.protein_g, m.carbs_g, m.fat_g, m.price_cents, m.tags]
    )
    console.log(`  ✅ ${m.name}`)
  }

  console.log(`\n✅ ${marmitas.length} marmitas inseridas!`)
  await db.end()
}

seed().catch(console.error)
