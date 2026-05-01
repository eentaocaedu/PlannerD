/**
 * Helper para extração de texto de PDF.
 */

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // 1. Validação básica de cabeçalho PDF
  const isPdf = buffer.toString('utf8', 0, 4) === '%PDF'
  
  console.log(`[PDF] Diagnóstico: Tamanho=${buffer.length} bytes, Header=${buffer.toString('utf8', 0, 10)}, IsPDF=${isPdf}`)

  if (!isPdf) {
    throw new Error('Arquivo PDF inválido ou corrompido.')
  }

  try {
    // Carregamento dinâmico para isolamento total
    console.log('[PDF] Carregando biblioteca pdf-parse...')
    const pdf = require('pdf-parse')
    
    // Configurações para garantir extração textual limpa
    const options = {
      pagerender: (pageData: any) => {
        // Função customizada para garantir extração de texto de todas as páginas
        return pageData.getTextContent()
          .then((textContent: any) => {
            let lastY, text = '';
            for (let item of textContent.items) {
              if (lastY == item.transform[5] || !lastY) {
                text += item.str;
              } else {
                text += '\n' + item.str;
              }
              lastY = item.transform[5];
            }
            return text;
          });
      }
    }

    const data = await pdf(buffer)
    
    const extractedText = data.text ? data.text.trim() : ''
    console.log(`[PDF] Extração concluída. Tamanho do texto: ${extractedText.length} caracteres.`)

    // Se o texto for muito curto, pode ser um PDF de imagem ou erro de extração
    if (extractedText.length < 20) {
      console.warn('[PDF] Texto extraído muito curto. Possível PDF de imagem.')
      throw new Error('Não encontrei texto selecionável neste PDF. Envie um PDF com texto copiável ou use DOCX.')
    }

    // Limpeza básica: normalizar espaços e quebras
    return extractedText
      .replace(/[ \t]+/g, ' ') // Normaliza espaços horizontais
      .replace(/\n\s*\n/g, '\n\n') // Normaliza quebras de linha duplas
      .trim()

  } catch (error: any) {
    console.error('[PDF] Erro real na extração:', error)
    
    // Se for nosso erro customizado, propaga
    if (error.message.includes('Não encontrei texto selecionável') || 
        error.message.includes('PDF inválido')) {
      throw error
    }
    
    // Erro inesperado da biblioteca
    throw new Error('Não consegui processar este PDF no servidor. Tente DOCX ou envie outro PDF com texto selecionável.')
  }
}
