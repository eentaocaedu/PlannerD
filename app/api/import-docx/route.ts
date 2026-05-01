import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractTextFromDocx } from '@/lib/docx'

// Forçar runtime Node.js para garantir compatibilidade com extração de arquivos
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
    let fileType = ''

    console.log(`[Import] Recebido arquivo: ${fileName} (${file.size} bytes)`)

    if (fileName.endsWith('.docx')) {
      fileType = 'docx'
      const buffer = Buffer.from(await file.arrayBuffer())
      text = await extractTextFromDocx(buffer)
    } else if (fileName.endsWith('.pdf')) {
      fileType = 'pdf'
      // IMPORTANTE: Import dinâmico para isolar dependências de PDF do fluxo DOCX
      // Isso evita erros como "DOMMatrix is not defined" em rotas que não usam PDF
      try {
        const { extractTextFromPdf } = await import('@/lib/pdf')
        const buffer = Buffer.from(await file.arrayBuffer())
        text = await extractTextFromPdf(buffer)
      } catch (pdfErr: any) {
        console.error('[Import] Erro específico no fluxo PDF:', pdfErr.message)
        return NextResponse.json({ 
          success: false, 
          error: pdfErr.message || 'Não consegui processar este PDF. Tente DOCX ou envie outro PDF com texto selecionável.' 
        }, { status: 400 })
      }
    } else {
      return NextResponse.json({ 
        success: false,
        error: 'Formato não suportado. Envie um arquivo DOCX ou PDF com texto selecionável.' 
      }, { status: 400 })
    }

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ 
        success: false, 
        error: 'O arquivo parece estar vazio ou não contém texto extraível.' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      text,
      fileType
    })
  } catch (error: any) {
    console.error('[Import] Erro crítico na API:', error)
    
    // Garantir que SEMPRE retornamos JSON, nunca HTML de erro do Next
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Falha interna ao processar o arquivo. Tente novamente ou use outro formato.' 
    }, { status: 500 })
  }
}
