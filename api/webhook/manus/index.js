// Edge Function: /api/webhook/manus
// Recebe eventos do Manus AI (perfis encontrados, DMs enviadas, etc)
// POST { event, profile, metadata }
// Retorna: { received: true }

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
    const { event, profile, metadata } = body

    // Log evento recebido
    console.log('[Manus Webhook] Event received:', {
      event,
      profile: profile ? {
        name: profile.name,
        instagram: profile.instagram
      } : null,
      timestamp: new Date().toISOString()
    })

    // Processar diferentes tipos de eventos
    switch (event) {
      case 'profile_found':
        console.log('[Manus] Perfil encontrado:', profile?.instagram)
        break
      
      case 'dm_sent':
        console.log('[Manus] DM enviada para:', profile?.instagram)
        break
      
      case 'dm_response':
        console.log('[Manus] Resposta recebida de:', profile?.instagram)
        // Aqui poderia atualizar status no FlowSpecta
        break
      
      case 'error':
        console.error('[Manus] Erro:', metadata?.error)
        break
      
      default:
        console.log('[Manus] Evento desconhecido:', event)
    }

    // Retornar confirmação
    return new Response(JSON.stringify({
      received: true,
      event,
      processed_at: new Date().toISOString(),
      message: 'Webhook processed successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in manus webhook:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
