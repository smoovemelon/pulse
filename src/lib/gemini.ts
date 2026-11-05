const MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3-flash-preview']

interface GeminiResult<T> {
  data: T
  model: string
}

function cleanJson(rawText: string) {
  return rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

export async function callGemini<T>(payload: unknown, apiKey: string): Promise<GeminiResult<T>> {
  const key = apiKey.trim()
  if (!key) throw new Error('Missing API key')
  let lastError: Error | null = null

  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`
      const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-goog-api-key': key }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      })

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        throw new Error(errData?.error?.message || `HTTP ${res.status}`)
      }

      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>
      }
      const parts = data?.candidates?.[0]?.content?.parts || []
      const textPart = parts.find((part) => part.text && !part.thought) || parts[0]
      if (!textPart?.text) throw new Error('Empty response from model')

      return { data: JSON.parse(cleanJson(textPart.text)) as T, model }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Model request failed')
    }
  }

  throw lastError || new Error('All model endpoints failed to respond')
}

export function buildCategoricalPayload(anchor: string, rawAction: string, duration: number) {
  const systemPrompt = `You classify one logged action against the user's anchor ("${anchor}"). Return only the categorical rubric. Do not invent point values.

Ratings:
- relevance: DIRECT when this is a causal step toward the anchor, ENABLING when it prepares that work, GENERAL otherwise.
- strain: HIGH, MEDIUM, or LOW.
- weightClass: HEAVYWEIGHT for a strong direct effort, CRUISERWEIGHT for a solid direct or enabling effort, LIGHTWEIGHT otherwise.
- reasoning: one candid sentence.

Calibration for the anchor "${anchor}":
1. "Finished the main deliverable for ${anchor}" → DIRECT, HIGH, HEAVYWEIGHT.
2. "Prepared the tools that support ${anchor}" → ENABLING, MEDIUM, CRUISERWEIGHT.
3. "Tidied the room" → GENERAL, LOW, LIGHTWEIGHT.`

  return {
    contents: [{ parts: [{ text: `Logged: "${rawAction}", Duration: ${duration} mins` }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          relevance: { type: 'STRING', enum: ['DIRECT', 'ENABLING', 'GENERAL'] },
          strain: { type: 'STRING', enum: ['HIGH', 'MEDIUM', 'LOW'] },
          weightClass: { type: 'STRING', enum: ['HEAVYWEIGHT', 'CRUISERWEIGHT', 'LIGHTWEIGHT'] },
          reasoning: { type: 'STRING' },
        },
        required: ['relevance', 'strain', 'weightClass', 'reasoning'],
      },
    },
  }
}

export function buildHabitPayload(anchor: string, habits: readonly { id: string; title: string }[]) {
  const lines = habits.map((habit) => `${habit.id}: ${habit.title}`).join('\n')
  return {
    contents: [{ parts: [{ text: lines }] }],
    systemInstruction: {
      parts: [{
        text: `Rate each habit against the anchor "${anchor}". Return JSON {"habits":[{"id":"...","strain":"HIGH|MEDIUM|LOW","relevance":"DIRECT|ENABLING|GENERAL","weightClass":"HEAVYWEIGHT|CRUISERWEIGHT|LIGHTWEIGHT"}]}. Use HIGH strain for hard friction, DIRECT only for a causal habit, and HEAVYWEIGHT only for a strong direct effort.`,
      }],
    },
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  }
}
