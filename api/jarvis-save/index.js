// Edge Function: /api/jarvis-save
// Salva leads qualificados no FlowSpecta (Supabase)
// POST { name, instagram, score, tier, script, nicho, location, followers, campaign_id, user_id }
// Retorna: { lead_id, status }

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
    const {
      name,
      instagram,
      score,
      tier,
      script,
      nicho,
      location,
      followers,
      campaign_id,
      user_id
    } = body

    // Validação
    if (!name || !instagram || !campaign_id) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: name, instagram, campaign_id'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Inicializar Supabase
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://tqcdplapyymjbilraigg.supabase.co'
    const supabaseKey = process.env.SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseKey) {
      throw new Error('Supabase key not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // ========== SALVAR LEAD ==========
    
    // 1. Criar/atualizar lead base
    const leadBase = {
      name,
      instagram_username: instagram,
      user_id: user_id || '4f0cc0bb-d9c2-4812-8c9f-609017b87b10', // Default user ID
      score: score || 0,
      tier: tier || 'C',
      status: 'new',
      notes: `Script: ${script}\n\nLocalização: ${location || 'N/A'}\nSeguidores: ${followers || 0}`,
      metadata: {
        nicho,
        location,
        followers,
        generated_at: new Date().toISOString()
      }
    }

    // Tentar upsert (inserir ou atualizar)
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .upsert(leadBase, { onConflict: 'instagram_username' })
      .select()
      .single()

    let leadId

    if (leadError) {
      // Se upsert falhar, tentar insert simples
      console.warn('Upsert failed, trying insert:', leadError.message)
      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert(leadBase)
        .select()
        .single()
      
      if (insertError) {
        throw new Error(`Failed to create lead: ${insertError.message}`)
      }
      
      leadId = newLead.id
    } else {
      leadId = lead.id
    }

    // 2. Criar entrada na campanha
    const campaignRecord = {
      campaign_id,
      lead_id: leadId,
      status: 'pending'
    }

    const { data: campaignLead, error: clError } = await supabase
      .from('campaign_leads')
      .insert(campaignRecord)
      .select()
      .single()
    
    // Ignorar erro se já existir (código 23505 = duplicate)
    if (clError && clError.code !== '23505') {
      console.warn('Campaign link error (non-critical):', clError.message)
    }

    // Retornar sucesso
    return new Response(JSON.stringify({
      success: true,
      lead_id: leadId,
      campaign_lead_id: campaignLead?.id || null,
      status: 'saved',
      message: 'Lead saved successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in jarvis-save:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
