import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Função para validar formato de email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Função para validar formato de telefone (apenas números) - suporte internacional
function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '')
  // Suporte para números internacionais: mínimo 7 dígitos, máximo 15 dígitos
  return cleanPhone.length >= 7 && cleanPhone.length <= 15
}

// Função para normalizar telefone (apenas números)
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log(`[VALIDATE-PROFILE-UPDATE] ${req.method} - ${new Date().toISOString()}`)

  try {
    const { email, phone, currentUserId } = await req.json()

    console.log('[VALIDATE-PROFILE-UPDATE] Dados recebidos:', { 
      email: email ? email.substring(0, 3) + '***' : 'não fornecido',
      phone: phone ? phone.substring(0, 3) + '***' : 'não fornecido',
      currentUserId: currentUserId ? currentUserId.substring(0, 8) + '***' : 'não fornecido'
    })

    // Validações básicas
    if (!currentUserId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID do usuário atual é obrigatório',
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    if (!email && !phone) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email ou telefone deve ser fornecido',
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Validar formato do email se fornecido
    if (email && !isValidEmail(email)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Formato de email inválido',
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Validar formato do telefone se fornecido
    if (phone && !isValidPhone(phone)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Formato de telefone inválido. Use apenas números (mínimo 7 dígitos, máximo 15 dígitos)',
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Usar SERVICE_ROLE_KEY para acessar dados diretamente
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    )

    const errors: string[] = []
    const normalizedPhone = phone ? normalizePhone(phone) : null

    // Verificar se email já existe (excluindo o usuário atual)
    if (email) {
      console.log('[VALIDATE-PROFILE-UPDATE] Verificando email único...')
      
      const { data: emailCheck, error: emailError } = await supabase
        .from('poupeja_users')
        .select('id, email')
        .eq('email', email.toLowerCase().trim())
        .neq('id', currentUserId)
        .single()

      if (emailError && emailError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[VALIDATE-PROFILE-UPDATE] Erro ao verificar email:', emailError)
        throw new Error(`Erro ao verificar email: ${emailError.message}`)
      }

      if (emailCheck) {
        errors.push('Este email já está sendo usado por outro usuário')
        console.log('[VALIDATE-PROFILE-UPDATE] Email já existe:', emailCheck.id)
      } else {
        console.log('[VALIDATE-PROFILE-UPDATE] Email disponível')
      }
    }

    // Verificar se telefone já existe (excluindo o usuário atual)
    if (normalizedPhone && normalizedPhone.length > 0) {
      console.log('[VALIDATE-PROFILE-UPDATE] Verificando telefone único...')
      
      const { data: phoneCheck, error: phoneError } = await supabase
        .from('poupeja_users')
        .select('id, phone')
        .eq('phone', normalizedPhone)
        .neq('id', currentUserId)
        .single()

      if (phoneError && phoneError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[VALIDATE-PROFILE-UPDATE] Erro ao verificar telefone:', phoneError)
        throw new Error(`Erro ao verificar telefone: ${phoneError.message}`)
      }

      if (phoneCheck) {
        errors.push('Este número de WhatsApp já está sendo usado por outro usuário')
        console.log('[VALIDATE-PROFILE-UPDATE] Telefone já existe:', phoneCheck.id)
      } else {
        console.log('[VALIDATE-PROFILE-UPDATE] Telefone disponível')
      }
    }

    // Retornar resultado
    if (errors.length > 0) {
      console.log('[VALIDATE-PROFILE-UPDATE] Validação falhou:', errors)
      return new Response(JSON.stringify({
        success: false,
        errors,
        timestamp: new Date().toISOString()
      }), {
        status: 200, // Sucesso com dados de erro
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    console.log('[VALIDATE-PROFILE-UPDATE] Validação passou - dados únicos')
    return new Response(JSON.stringify({
      success: true,
      message: 'Email e telefone disponíveis para atualização',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error) {
    console.error("[VALIDATE-PROFILE-UPDATE] Error:", error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})
