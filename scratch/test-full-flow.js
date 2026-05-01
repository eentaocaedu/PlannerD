const { parsePlanWithGemini } = require('./lib/gemini');
const { extractTextFromDocx } = require('./lib/docx');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function testFullFlow() {
  try {
    const docxPath = path.join(process.cwd(), 'node_modules/mammoth/test/test-data/simple-list.docx');
    const buffer = fs.readFileSync(docxPath);
    const text = await extractTextFromDocx(buffer);
    
    console.log('[Test] Texto extraído:', text);
    console.log('[Test] Chamando Gemini...');
    
    const result = await parsePlanWithGemini(text);
    console.log('[Test] SUCESSO TOTAL! Items identificados:', result.items.length);
  } catch (err) {
    console.error('[Test] ERRO NO FLUXO:', err.message);
  }
}

testFullFlow();
