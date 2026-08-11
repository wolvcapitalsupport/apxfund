import { NextRequest, NextResponse } from 'next/server'

type CoachRequestBody = {
  context?: string
  userData?: {
    balance?: number
    totalProfit?: number
    investments?: Array<{ expectedProfit?: number; status?: string }>
    [k: string]: any
  }
}

function fallbackMessage(userData?: CoachRequestBody['userData']) {
  const balance = Number(userData?.balance || 0)
  const activeExpected = Array.isArray(userData?.investments)
    ? userData!.investments
        .filter(i => i?.status === 'ACTIVE')
        .reduce((sum, i) => sum + Number(i?.expectedProfit || 0), 0)
    : 0

  if (balance > 0 && activeExpected > 0) {
    return `You currently hold $${balance.toFixed(2)} and your active cycles are positioned to generate about $${activeExpected.toFixed(2)} in expected profit. Withdrawing now breaks compounding momentum; one more cycle may materially improve your outcome.`
  }

  if (balance > 0) {
    return `You currently hold $${balance.toFixed(2)}. Before withdrawing, compare this to the upside of keeping funds compounding for one additional cycle.`
  }

  return 'Withdrawing now pauses your compounding momentum. If you can sustain one more cycle, your long-term growth curve stays stronger.'
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CoachRequestBody
    const context = body.context || 'Give a short, direct investor coaching insight.'
    const userData = body.userData || {}
    const groqApiKey = process.env.GROQ_API_KEY
    const xaiApiKey = process.env.XAI_API_KEY
    const model = process.env.COACH_MODEL || process.env.GROQ_MODEL || process.env.XAI_MODEL || 'llama-3.1-8b-instant'

    if (!groqApiKey && !xaiApiKey) {
      return NextResponse.json({ message: fallbackMessage(userData), source: 'fallback-no-key' })
    }

    const prompt = [
      'You are an institutional-grade investment coach for APXFund.',
      'Tone: concise, sober, motivating, never manipulative.',
      'Response length: 2-4 sentences only.',
      'If numbers are provided, reference them clearly.',
      'Context:',
      context,
      'User data (JSON):',
      JSON.stringify(userData),
    ].join('\n')

    const payload = {
      model,
      temperature: 0.4,
      messages: [
        { role: 'system', content: 'You provide short investment coaching insights.' },
        { role: 'user', content: prompt },
      ],
    }

    // Prefer Groq when available (OpenAI-compatible API).
    const response = groqApiKey
      ? await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
      : await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${xaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

    if (!response.ok) {
      const text = await response.text()
      console.error('[coach] provider error:', response.status, text)
      return NextResponse.json({ message: fallbackMessage(userData), source: 'fallback-provider-error' })
    }

    const data = await response.json()
    const message = data?.choices?.[0]?.message?.content?.trim()

    if (!message) {
      return NextResponse.json({ message: fallbackMessage(userData), source: 'fallback-empty' })
    }

    return NextResponse.json({ message, source: groqApiKey ? 'groq' : 'xai' })
  } catch (error) {
    console.error('[coach] route error:', error)
    return NextResponse.json({ message: fallbackMessage(), source: 'fallback-exception' })
  }
}

export async function GET() {
  const provider = process.env.GROQ_API_KEY ? 'groq' : process.env.XAI_API_KEY ? 'xai' : 'none'
  return NextResponse.json({
    ok: true,
    provider,
    providerReady: provider !== 'none',
    model: process.env.COACH_MODEL || process.env.GROQ_MODEL || process.env.XAI_MODEL || 'llama-3.1-8b-instant',
  })
}
