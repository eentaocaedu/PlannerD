import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parsePlanWithGemini } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    console.log('[ParsePlan] Início da requisição')
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.warn('[ParsePlan] Usuário não autenticado')
      return NextResponse.json({ 
        success: false, 
        error: 'Sessão expirada. Por favor, faça login novamente.' 
      }, { status: 401 })
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error('[ParsePlan] GEMINI_API_KEY ausente')
      return NextResponse.json({ 
        success: false, 
        error: 'GEMINI_API_KEY não configurada no ambiente.' 
      }, { status: 500 })
    }

    let body
    try {
      body = await req.json()
    } catch (e) {
      console.error('[ParsePlan] Erro ao ler JSON do body')
      return NextResponse.json({ 
        success: false, 
        error: 'JSON inválido no corpo da requisição.' 
      }, { status: 400 })
    }

    const { text } = body

    if (!text) {
      console.warn('[ParsePlan] Texto ausente')
      return NextResponse.json({ 
        success: false, 
        error: 'O texto para processamento está ausente.' 
      }, { status: 400 })
    }

    console.log(`[ParsePlan] Texto recebido: ${text.length} caracteres. Chamando Gemini...`)
    
    try {
      const data = await parsePlanWithGemini(text)
      console.log('[ParsePlan] Sucesso ao processar com Gemini')
      return NextResponse.json({ success: true, data })
    } catch (geminiError: any) {
      console.error('[ParsePlan] Erro na lib/gemini:', geminiError.message)
      
      let userMessage = geminiError.message || 'Erro inesperado ao processar com IA.'
      if (geminiError.name === 'ZodError') {
        userMessage = 'A resposta da IA veio incompleta ou fora do formato esperado.'
      } else if (geminiError instanceof SyntaxError) {
        userMessage = 'A resposta da IA não veio em JSON válido.'
      }

      return NextResponse.json({ 
        success: false, 
        error: userMessage
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('[ParsePlan] Erro fatal na rota:', error.message, error.stack)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno ao processar o planejamento com IA.' 
    }, { status: 500 })
  }
}
