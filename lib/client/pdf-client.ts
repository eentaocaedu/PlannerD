/**
 * Utilitário client-side para extração de texto de PDFs.
 * Roda exclusivamente no navegador para evitar incompatibilidades com ambientes serverless.
 */

export async function extractTextFromPdfClient(file: File): Promise<string> {
  try {
    // Carregamento dinâmico da biblioteca apenas no client
    const pdfjs = await import('pdfjs-dist');
    
    // Configurar o worker usando CDN para evitar problemas de roteamento/bundling no Next.js
    // Usamos a versão exata instalada para garantir compatibilidade
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      disableFontFace: true // Melhora estabilidade em alguns browsers
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';

    console.log(`[PDF Client] Lendo ${pdf.numPages} páginas...`);

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Juntar os fragmentos de texto da página
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
        
      fullText += pageText + '\n\n';
    }

    const cleanedText = fullText
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    if (cleanedText.length < 50) {
      throw new Error('Não encontrei texto selecionável suficiente neste PDF. Envie um PDF com texto copiável ou use DOCX.');
    }

    return cleanedText;
  } catch (error: any) {
    console.error('[PDF Client] Erro na extração:', error);
    
    if (error.message.includes('Não encontrei texto')) {
      throw error;
    }
    
    throw new Error('Não consegui ler este PDF no navegador. Tente converter para DOCX ou envie outro PDF.');
  }
}
