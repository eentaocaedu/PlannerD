/**
 * Normaliza e formata o campo de Direção de Arte para melhor leitura humana.
 * Garante que blocos como "Capa:", "Slide 1:", "Subtexto:" fiquem separados por quebras de linha.
 */
export function formatCreativeDirection(value?: string | null): string | null {
  if (!value || typeof value !== 'string') return null

  let formatted = value.trim()
  if (!formatted) return null

  const markers = [
    'capa:', 'subtexto:', 'header:', 'texto complementar:',
    'slide 1:', 'slide 2:', 'slide 3:', 'slide 4:', 'slide 5:',
    'card 1:', 'card 2:', 'card 3:', 'página 1:', 'página 2:',
    'cena 1:', 'cena 2:', 'take 1:', 'take 2:'
  ]

  // Itera sobre os marcadores para inserir quebras de linha antes deles
  markers.forEach(marker => {
    // Regex para encontrar o marcador (case insensitive) que não esteja no início da string
    // e que não tenha uma quebra de linha imediata antes dele.
    const regex = new RegExp(`([^\\n])\\s*(${marker})`, 'gi')
    
    formatted = formatted.replace(regex, (match, prevChar, foundMarker) => {
      const capitalized = foundMarker.charAt(0).toUpperCase() + foundMarker.slice(1).toLowerCase()
      return `${prevChar}\n\n${capitalized}`
    })
    
    // Caso o marcador esteja no início, apenas capitaliza
    const startRegex = new RegExp(`^(${marker})`, 'i')
    formatted = formatted.replace(startRegex, (match, foundMarker) => {
      return foundMarker.charAt(0).toUpperCase() + foundMarker.slice(1).toLowerCase()
    })
  })

  // Remove quebras triplas ou excessivas acidentais
  return formatted.replace(/\n{2,}/g, '\n\n').trim()
}
