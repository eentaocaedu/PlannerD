import pdf from 'pdf-parse'

/**
 * Extrai texto de um buffer de PDF com texto selecionável.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer)
    
    if (!data || !data.text || data.text.trim().length < 50) {
      throw new Error('Não consegui extrair texto deste PDF. Envie um PDF com texto selecionável ou use DOCX.')
    }

    return data.text.trim()
  } catch (error: any) {
    console.error('[PDF] Erro na extração:', error.message)
    throw new Error('Não consegui ler o PDF. Verifique se o arquivo não está protegido ou corrompido.')
  }
}
