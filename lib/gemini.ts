import { GoogleGenerativeAI } from '@google/generative-ai'
import { ParsedPlanSchema, ParsedPlan } from './validators/plan'
import { PARSE_PLAN_PROMPT } from './prompts/parse-plan'
import { DistributeDatesResponseSchema, DistributeDatesResponse } from './validators/distribute-dates'
import { DISTRIBUTE_DATES_PROMPT } from './prompts/distribute-dates'
import { formatCreativeDirection } from './text-formatting'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

function cleanJsonResponse(raw: string): string {
  let cleaned = raw.trim()
  
  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim()

  // Find the first '{' and last '}' to extract the JSON object
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')

  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.slice(start, end + 1)
  }

  return cleaned
}

export async function parsePlanWithGemini(text: string): Promise<ParsedPlan> {
  const isDev = process.env.NODE_ENV === 'development'
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não configurada no ambiente.')
  }

  if (!text || text.trim().length < 10) {
    throw new Error('Não consegui ler conteúdo suficiente desse DOCX.')
  }

  // Lista de modelos na ordem exata solicitada pelo usuário
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash'
  ]

  let lastError: any = null

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Gemini] Tentando modelo: ${modelName}`)
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
        }
      })

      const fullPrompt = `${PARSE_PLAN_PROMPT}\n\nTEXTO EXTRAÍDO:\n${text}`
      const result = await model.generateContent(fullPrompt)
      const response = result.response
      const rawText = response.text()
      
      console.log(`[Gemini] Resposta de ${modelName} recebida.`)
      const jsonText = cleanJsonResponse(rawText)
      
      const parsedData = JSON.parse(jsonText)
      
      // Formatar direção de arte para leitura humana
      if (Array.isArray(parsedData.items)) {
        parsedData.items = parsedData.items.map((item: any) => ({
          ...item,
          creative_direction: formatCreativeDirection(item?.creative_direction)
        }))
      }

      const validatedData = ParsedPlanSchema.parse(parsedData)
      
      console.log(`[Gemini] Sucesso com ${modelName}`)
      return validatedData

    } catch (error: any) {
      lastError = error
      const status = error.message?.match(/\[(\d+) /)?.[1] || ''
      console.error(`[Gemini] Erro no modelo ${modelName} (Status ${status}):`, error.message)
      
      // Se for erro de quota ou modelo não encontrado, tenta o próximo
      if (status === '429' || status === '404' || error.message?.includes('not found') || error.message?.includes('quota')) {
        continue
      }
      
      // Se for erro de parse ou Zod, lançamos erro imediato
      if (error instanceof SyntaxError || error.name === 'ZodError') {
        throw new Error('A resposta da IA veio em um formato inválido ou incompleto. Verifique o DOCX.')
      }
      
      break
    }
  }

  // Tratamento de erros humanos específicos
  const errorMessage = lastError?.message || ''
  if (errorMessage.includes('429')) {
    throw new Error('Limite gratuito da API Gemini atingido ou indisponível no momento. Tente novamente mais tarde ou configure billing no Google AI Studio.')
  }
  if (errorMessage.includes('404') || errorMessage.includes('not found')) {
    throw new Error('Modelo Gemini indisponível neste projeto. Verifique os modelos habilitados no Google AI Studio.')
  }

  throw new Error('Não consegui organizar esse planejamento com segurança. Tente novamente ou ajuste o arquivo.')
}

export async function distributeDatesWithGemini(
  params: {
    month: number,
    year: number,
    allow_overflow_to_next_month: boolean,
    instructions: string,
    items: Array<{ temp_id: string, title: string, channel: string, format: string }>
  }
): Promise<DistributeDatesResponse> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não configurada no ambiente.')
  }

  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash'
  ]

  let lastError: any = null

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Gemini Distribution] Tentando modelo: ${modelName}`)
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
        }
      })

      const fullPrompt = `${DISTRIBUTE_DATES_PROMPT}\n\nCONTEXTO:\n${JSON.stringify(params, null, 2)}`
      const result = await model.generateContent(fullPrompt)
      const response = result.response
      const rawText = response.text()
      
      const jsonText = cleanJsonResponse(rawText)
      const parsedData = JSON.parse(jsonText)
      const validatedData = DistributeDatesResponseSchema.parse(parsedData)
      
      return validatedData

    } catch (error: any) {
      lastError = error
      const status = error.message?.match(/\[(\d+) /)?.[1] || ''
      console.error(`[Gemini Distribution] Erro no modelo ${modelName} (Status ${status}):`, error.message)
      
      if (status === '429' || status === '404' || error.message?.includes('not found') || error.message?.includes('quota')) {
        continue
      }
      
      if (error instanceof SyntaxError || error.name === 'ZodError') {
        throw new Error('A IA não conseguiu processar as datas corretamente. Tente mudar a instrução.')
      }
      
      break
    }
  }

  throw new Error(lastError?.message || 'Falha ao distribuir datas com IA.')
}
