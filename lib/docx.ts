import mammoth from 'mammoth'

export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    if (!buffer || buffer.length === 0) {
      throw new Error('Arquivo DOCX está vazio.')
    }

    const result = await mammoth.extractRawText({ buffer })
    
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('Não foi possível extrair texto deste arquivo DOCX.')
    }

    return result.value.trim()
  } catch (error: any) {
    console.error('Error extracting text from DOCX:', error)
    throw new Error(error.message || 'Falha ao ler o arquivo DOCX.')
  }
}
