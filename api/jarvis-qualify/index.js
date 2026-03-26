// Edge Function: /api/jarvis-qualify
// Qualifica leads do Instagram usando algoritmo JARVIS
// POST { name, instagram, followers, location, bio, nicho }
// Retorna: { approved, score, tier, script }

import { createClient } from '@supabase/supabase-js'

export default async function handler(req) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const body = await req.json()
    const { name, instagram, followers, location, bio, nicho } = body

    // Validação
    if (!name || !instagram || !nicho) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: name, instagram, nicho'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ========== ALGORITMO DE QUALIFICAÇÃO JARVIS ==========
    const breakdown = {
      followers: 0,
      digitalPresence: 0,
      activity: 0,
      location: 0
    }

    // Seguidores (0-30 pts)
    const followerCount = followers || 0
    if (followerCount >= 1000) breakdown.followers = 30
    else if (followerCount >= 500) breakdown.followers = 20
    else if (followerCount >= 200) breakdown.followers = 10

    // Presença Digital (0-40 pts)
    // Assumir sem site = 40 pontos (oportunidade!)
    breakdown.digitalPresence = 40

    // Atividade (0-15 pts)
    // Assumir ativo = 15 pontos
    breakdown.activity = 15

    // Localização (0-15 pts)
    const locationStr = (location || '').toLowerCase()
    if (locationStr.includes('rio grande do sul') || locationStr.includes('rs') ||
        locationStr.includes('porto alegre') || locationStr.includes('caxias') ||
        locationStr.includes('canoas') || locationStr.includes('pelotas')) {
      breakdown.location = 15
    } else if (locationStr.includes('sul') || locationStr.includes('santa catarina') ||
               locationStr.includes('paraná') || locationStr.includes('sc') || locationStr.includes('pr')) {
      breakdown.location = 10
    } else if (locationStr.includes('brasil') || locationStr.includes('brazil')) {
      breakdown.location = 5
    }

    const score = Object.values(breakdown).reduce((a, b) => a + b, 0)

    // Tier
    let tier
    if (score >= 85) tier = 'A'
    else if (score >= 70) tier = 'B'
    else tier = 'C'

    const approved = tier !== 'C'

    // Se não aprovado, retornar sem script
    if (!approved) {
      return new Response(JSON.stringify({
        approved: false,
        score,
        tier,
        breakdown,
        reason: 'Score abaixo do mínimo (70 pts)'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ========== GERAÇÃO DE SCRIPT ==========
    const scripts = {
      fitness: [
        `${name}, vi seu trabalho no Instagram — conteúdo de qualidade! Sou Brayan, trabalho com web design para studios de fitness. Posso te fazer uma pergunta rápida sobre como você está convertendo interesse em novos alunos?`,
        `${name}, seu studio tem uma identidade visual muito bem construída — não é todo studio que consegue transmitir o nível do trabalho só pelo feed. Sou o Brayan, faço sites para studios premium. Posso te fazer uma pergunta sobre como vocês estão convertendo esse interesse em matrículas?`,
        `Olá ${name}! Vi o post sobre os resultados dos alunos — dá pra sentir a diferença do trabalho de vocês. Sou Brayan, trabalho com web design para fitness. Tenho uma curiosidade: quando alguém descobre o studio pelo Instagram e quer saber mais, pra onde você manda essa pessoa hoje?`
      ],
      dentistas: [
        `Dr. ${name}, vi seu perfil — trabalho diferenciado! Sou Brayan, trabalho com web design para dentistas no RS. Posso te fazer uma pergunta sobre como você está convertendo interesse em agendamentos de consultas?`,
        `Dr. ${name}, seu consultório tem uma identidade visual muito bem construída. Sou o Brayan, faço sites para dentistas premium. Posso te fazer uma pergunta rápida sobre como seus pacientes agendam consultas hoje?`,
        `Olá Dr. ${name}! Vi o conteúdo sobre tratamentos — muito educativo. Sou Brayan, trabalho com web design para odontologia. Quando um paciente quer agendar uma consulta, pra onde você direciona ele hoje?`
      ],
      advogados: [
        `Dr. ${name}, vi seu perfil — conteúdo de autoridade! Sou Brayan, trabalho com web design para advogados. Posso te fazer uma pergunta sobre como você está convertendo interesse em consultas?`,
        `Dr. ${name}, seu escritório tem uma identidade visual bem construída. Sou o Brayan, faço sites para advogados premium. Posso te fazer uma pergunta rápida sobre como clientes entram em contato hoje?`,
        `Olá Dr. ${name}! Vi o conteúdo sobre ${nicho} — muito informativo. Sou Brayan, trabalho com web design para advocacia. Quando um cliente potencial quer uma consulta, qual o processo hoje?`
      ]
    }

    const nichoScripts = scripts[nicho] || scripts.fitness
    const script = nichoScripts[Math.floor(Math.random() * nichoScripts.length)]

    // Retornar aprovação + script
    return new Response(JSON.stringify({
      approved: true,
      score,
      tier,
      breakdown,
      script,
      metadata: {
        nicho,
        location,
        followers: followerCount
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in jarvis-qualify:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
