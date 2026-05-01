const { parsePlanWithGemini } = require('./lib/gemini');
const { extractTextFromDocx } = require('./lib/docx');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function test() {
  try {
    const docxPath = path.join(process.cwd(), 'node_modules/mammoth/test/test-data/simple-list.docx');
    console.log('[Test] Lendo arquivo:', docxPath);
    const buffer = fs.readFileSync(docxPath);
    const text = await extractTextFromDocx(buffer);
    
    console.log('[Test] Texto extraído (primeiros 100 chars):', text.substring(0, 100));
    
    console.log('[Test] Chamando Gemini...');
    const result = await parsePlanWithGemini(text);
    console.log('[Test] Sucesso! Resultado:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('[Test] ERRO CAPTURADO:', err.message);
    if (err.stack) {
      // console.error(err.stack); // Opcional, se precisar de mais detalhes
    }
  }
}

test();
