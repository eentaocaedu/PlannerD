import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { distributeDatesWithGemini } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Sessão expirada.' }, { status: 401 })
    }

    const body = await req.json()
    const { month, year, allow_overflow_to_next_month, instructions, items } = body

    console.log(`[API Distribution] Recebido: month=${month}, year=${year}, items=${items?.length}, hasInstructions=${!!instructions}, allow_overflow=${allow_overflow_to_next_month}`)

    if (!month || !year || !instructions || !items || items.length === 0) {
      const missing = []
      if (!month) missing.push('mês')
      if (!year) missing.push('ano')
      if (!instructions) missing.push('instrução')
      if (!items || items.length === 0) missing.push('posts')
      
      return NextResponse.json({ 
        success: false, 
        error: `Informe ${missing.join(', ')} para distribuir.` 
      }, { status: 400 })
    }

    const result = await distributeDatesWithGemini({
      month,
      year,
      allow_overflow_to_next_month: !!allow_overflow_to_next_month,
      instructions,
      items
    })

    // Validação extra: Se overflow não permitido, garantir que nenhuma data foge do mês
    if (!allow_overflow_to_next_month) {
      const validAssignments = result.assignments.filter(a => {
        const date = new Date(a.date + 'T12:00:00') // evita problemas de timezone
        return date.getMonth() + 1 === month && date.getFullYear() === year
      })

      const invalidAssignments = result.assignments.filter(a => {
        const date = new Date(a.date + 'T12:00:00')
        return date.getMonth() + 1 !== month || date.getFullYear() !== year
      })

      if (invalidAssignments.length > 0) {
        result.assignments = validAssignments
        invalidAssignments.forEach(ia => {
          result.overflow_items.push({
            temp_id: ia.temp_id,
            reason: 'Data sugerida fora do mês permitido.'
          })
        })
        
        if (!result.warnings.some(w => w.type === 'overflow')) {
          result.warnings.push({
            type: 'overflow',
            message: 'Algumas datas sugeridas pela IA foram bloqueadas por estarem fora do mês permitido.'
          })
        }
      }
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error: any) {
    console.error('API /api/gemini/distribute-dates Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Falha ao processar distribuição de datas.' 
    }, { status: 500 })
  }
}
