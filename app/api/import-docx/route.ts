import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractTextFromDocx } from '@/lib/docx'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'Arquivo ausente.' }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()
    let text = ''

    console.log(`[Import API] Recebido arquivo: ${fileName}`)

    if (fileName.endsWith('.docx')) {
      const buffer = Buffer.from(await file.arrayBuffer())
      text = await extractTextFromDocx(buffer)
      console.log(`[Import API] DOCX processado: ${text.length} chars`)
    } else if (fileName.endsWith('.pdf')) {
      // PDF agora é processado no cliente.
      return NextResponse.json({ 
        success: false, 
        error: 'PDF agora é processado no navegador por segurança. Recarregue a página e tente novamente.' 
      }, { status: 400 })
    } else {
      return NextResponse.json({ 
        success: false,
        error: 'Formato não suportado. Envie DOCX.' 
      }, { status: 400 })
    }

    return NextResponse.json({ success: true, text })
  } catch (error: any) {
    console.error('[Import API] Erro crítico:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Falha ao processar o arquivo.' 
    }, { status: 500 })
  }
}
