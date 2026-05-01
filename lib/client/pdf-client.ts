'use client'

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

/**
 * Configuração do Worker do PDF.js.
 * Utilizamos o asset local do pacote 'pdfjs-dist' para evitar dependência de CDNs externas
 * que podem falhar ou ter versões incompatíveis em produção.
 */
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch (e) {
    console.error('[PDF Client] Erro ao configurar worker:', e);
  }
}

/**
 * Utilitário client-side para extração de texto de PDFs.
 * Roda exclusivamente no navegador para evitar incompatibilidades com ambientes serverless da Vercel.
 */
export async function extractTextFromPdfClient(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Carregar o documento
    const loadingTask = pdfjsLib.getDocument({ 
      data,
      useSystemFonts: true,
      disableFontFace: true,
      // Fallback: se o worker falhar por algum motivo de path em produção, 
      // tentamos rodar na main thread para PDFs pequenos.
      stopAtErrors: false
    });
    
    const pdf = await loadingTask.promise;
    const pages: string[] = [];

    console.log(`[PDF Client] Processando ${pdf.numPages} páginas...`);

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .filter(Boolean)
        .join(' ');
        
      pages.push(pageText);
    }

    const fullText = pages
      .join('\n\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!fullText || fullText.length < 100) {
      console.warn('[PDF Client] Texto extraído muito curto:', fullText.length);
      throw new Error('Não encontrei texto selecionável suficiente neste PDF. Envie um PDF com texto copiável ou use DOCX.');
    }

    return fullText;
  } catch (error: any) {
    console.error('[PDF Client] Falha na extração:', error);
    
    if (error.message.includes('Não encontrei texto')) {
      throw error;
    }
    
    throw new Error('Não consegui ler este PDF no navegador. Tente converter para DOCX ou envie outro PDF.');
  }
}
