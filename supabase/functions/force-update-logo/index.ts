import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    )

    // Forçar atualização da logo para a nova logo do Contabiliza
    const { data, error } = await supabase
      .from('poupeja_settings')
      .upsert({
        category: 'branding',
        key: 'logo_url',
        value: '/lovable-uploads/feb4b0d7-9e89-45bc-bae1-72b1af54eacd.png',
        description: 'URL da logo da empresa',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'category,key'
      })

    if (error) {
      console.error('Erro ao atualizar logo:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Também atualizar o nome da empresa se necessário
    const { data: nameData, error: nameError } = await supabase
      .from('poupeja_settings')
      .upsert({
        category: 'branding',
        key: 'company_name',
        value: 'Contabiliza',
        description: 'Nome da empresa exibido na aplicação',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'category,key'
      })

    if (nameError) {
      console.error('Erro ao atualizar nome da empresa:', nameError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Logo atualizada com sucesso',
        data: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro na função:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
