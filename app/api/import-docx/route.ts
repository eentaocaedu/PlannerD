import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractTextFromDocx } from '@/lib/docx'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Arquivo ausente.' }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()
    let text = ''

    if (fileName.endsWith('.docx')) {
      const buffer = Buffer.from(await file.arrayBuffer())
      text = await extractTextFromDocx(buffer)
    } else if (fileName.endsWith('.pdf')) {
      const { extractTextFromPdf } = await import('@/lib/pdf')
      const buffer = Buffer.from(await file.arrayBuffer())
      text = await extractTextFromPdf(buffer)
    } else {
      return NextResponse.json({ 
        error: 'Formato não suportado. Envie um arquivo DOCX ou PDF com texto selecionável.' 
      }, { status: 400 })
    }

    return NextResponse.json({ success: true, text })
  } catch (error: any) {
    console.error('API /api/import-docx Error:', error)
    return NextResponse.json({ error: error.message || 'Falha ao processar o arquivo.' }, { status: 500 })
  }
}
