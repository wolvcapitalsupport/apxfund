type InsightRequest = {
  system: string
  user: string
  fallback: string
  model?: string
  temperature?: number
}

type InsightResponse = {
  message: string
  source: 'groq' | 'xai' | 'fallback'
}

export async function generateInsight({
  system,
  user,
  fallback,
  model,
  temperature = 0.35,
}: InsightRequest): Promise<InsightResponse> {
  const groqApiKey = process.env.GROQ_API_KEY
  const xaiApiKey = process.env.XAI_API_KEY
  const selectedModel = model || process.env.COACH_MODEL || process.env.GROQ_MODEL || process.env.XAI_MODEL || 'llama-3.1-8b-instant'

  if (!groqApiKey && !xaiApiKey) {
    return { message: fallback, source: 'fallback' }
  }

  const payload = {
    model: selectedModel,
    temperature,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  }

  try {
    if (groqApiKey) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        const message = data?.choices?.[0]?.message?.content?.trim()
        if (message) return { message, source: 'groq' }
      }
    }

    if (xaiApiKey) {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${xaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        const message = data?.choices?.[0]?.message?.content?.trim()
        if (message) return { message, source: 'xai' }
      }
    }
  } catch (error) {
    console.error('[aiProvider] provider error:', error)
  }

  return { message: fallback, source: 'fallback' }
}
