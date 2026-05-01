/**
 * Helper para extração de texto de PDF.
 */

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  if (!buffer || buffer.length === 0) {
    throw new Error('PDF vazio ou inválido.')
  }

  // Validação básica de cabeçalho PDF
  const header = buffer.subarray(0, 4).toString('utf8')
  if (header !== '%PDF') {
    throw new Error('Arquivo PDF inválido ou corrompido.')
  }

  try {
    // Carregamento dinâmico compatível com ESM/Next.js
    // Versão 1.1.1 é mais estável para ambientes serverless (não pede DOMMatrix)
    const pdfImport = await import('pdf-parse')
    const pdf = pdfImport.default || pdfImport

    const result = await pdf(buffer)

    // Limpeza e normalização do texto
    const text = result.text
      ?.replace(/\r/g, '\n')
      ?.replace(/[ \t]+/g, ' ')
      ?.replace(/\n{3,}/g, '\n\n')
      ?.trim()

    if (!text || text.length < 100) {
      console.warn('[PDF] Texto extraído muito curto:', text?.length)
      throw new Error('Não encontrei texto selecionável suficiente neste PDF. Envie um PDF com texto copiável ou use DOCX.')
    }

    return text
  } catch (error: any) {
    console.error('[PDF] Erro real na extração:', error)
    
    if (error.message.includes('Não encontrei texto') || error.message.includes('PDF inválido')) {
      throw error
    }
    
    throw new Error('Não consegui processar este PDF no servidor. Tente converter para DOCX ou envie outro PDF.')
  }
}
