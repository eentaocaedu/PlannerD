const { GoogleGenerativeAI } = require('@google/generative-ai');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PARSE_PLAN_PROMPT = `Responda SOMENTE com JSON válido. Não use blocos de código. Todos os campos devem existir.`;

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  console.log('[Gemini] API Key presente:', !!process.env.GEMINI_API_KEY);

  try {
    const docxPath = path.join(process.cwd(), 'node_modules/mammoth/test/test-data/simple-list.docx');
    const buffer = fs.readFileSync(docxPath);
    const resultText = await mammoth.extractRawText({ buffer });
    const text = resultText.value;
    console.log('[Gemini] Tamanho do texto:', text.length);

    const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    for (const modelName of models) {
      try {
        console.log('[Gemini] Chamada iniciada:', modelName);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { responseMimeType: "application/json" }
        });
        const prompt = `${PARSE_PLAN_PROMPT}\n\nTEXTO:\n${text}`;
        const result = await model.generateContent(prompt);
        console.log('[Gemini] Chamada finalizada com sucesso:', modelName);
        console.log('[Gemini] Resposta bruta (800 chars):', result.response.text().substring(0, 800));
        return;
      } catch (e) {
        console.error(`[Gemini] Erro no modelo ${modelName}:`, e.message);
      }
    }
  } catch (err) {
    console.error('[Gemini] Erro Geral:', err.message);
  }
}

test();
