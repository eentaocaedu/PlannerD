/**
 * Helper para extração de texto de PDF.
 */

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  if (!buffer || buffer.length === 0) {
    throw new Error('PDF vazio ou inválido.')
  }

  // Validação de cabeçalho PDF
  const header = buffer.subarray(0, 4).toString('utf8')
  if (header !== '%PDF') {
    throw new Error('Arquivo PDF inválido ou corrompido.')
  }

  try {
    // Carregamento dinâmico via require para garantir compatibilidade com CommonJS
    // Versão 1.1.1 é estável para Node.js puro
    const pdfParse = require('pdf-parse')
    
    const result = await pdfParse(buffer)

    // Limpeza e normalização agressiva do texto
    const text = result.text
      ?.replace(/\r/g, '\n')
      ?.replace(/[ \t]+/g, ' ')
      ?.replace(/\n{3,}/g, '\n\n')
      ?.trim()

    if (!text || text.length < 50) {
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
