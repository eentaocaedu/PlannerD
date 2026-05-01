const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  console.log('[Test] API Key presente:', !!process.env.GEMINI_API_KEY);

  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash'
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Test] Testando modelo: ${modelName}`);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent('Responda apenas com JSON: {"ok": true}');
      console.log(`[Test] SUCESSO com ${modelName}:`, result.response.text());
      return;
    } catch (e) {
      console.error(`[Test] FALHA com ${modelName}:`, e.message);
    }
  }
}

testModels();
