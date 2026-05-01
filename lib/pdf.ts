/**
 * Helper para extração de texto de PDF.
 * IMPORTANTE: Não fazemos imports no topo do arquivo para evitar que o bundler
 * carregue dependências pesadas ou incompatíveis (como pdfjs que pede DOMMatrix)
 * em fluxos que não utilizam PDF (como a importação de DOCX).
 */

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Carregamento dinâmico apenas quando a função é chamada
    const pdf = require('pdf-parse')
    
    const data = await pdf(buffer)
    
    if (!data || !data.text || data.text.trim().length < 50) {
      throw new Error('Não consegui extrair texto deste PDF. Envie um PDF com texto selecionável ou use DOCX.')
    }

    return data.text.trim()
  } catch (error: any) {
    console.error('[PDF] Erro na extração:', error.message)
    
    // Propaga erros de validação conhecidos
    if (error.message.includes('Não consegui extrair texto')) {
      throw error
    }
    
    // Tratamento genérico para falhas de leitura
    throw new Error('Não consegui ler o PDF. Verifique se o arquivo não está protegido, corrompido ou se é apenas uma imagem.')
  }
}
