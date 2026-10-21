const MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3-flash-preview']

export interface ActionJudgment {
  polished_title: string
  category: string
  effort_strain: number
  anchor_alignment: number
  reasoning: string
}

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
  let lastError: Error | null = null

  for (const model of MODELS) {
    try {
      const url = key
        ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`
        : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (key) headers['x-goog-api-key'] = key

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

export function buildJudgmentPayload(anchor: string, rawAction: string, duration: number, history: string) {
  const systemPrompt = `You evaluate user actions in Altius.
Evaluate effort strain (1-10) and alignment to their anchor ("${anchor}").

RECENT TRAINING CONTEXT:
${history || 'No previous history recorded yet.'}
Evaluate whether this new entry represents progressive volume, healthy recovery, or repetitive point farming.

CRITICAL TITLE POLISHING RULE:
- NEVER substitute or copy the user's discipline anchor as their action title!
- Reflect what the user ACTUALLY logged: "${rawAction}".
- Convention: "[Duration/Metric] [Focus Area/Movement] [Partner/Context]"
- Example: "Push day at the gym with Brandon" + 60m => "60-Min Push Session w/ Brandon".
- NO filler words like "Completed", "Finished", or "Did". Title Case, max 42 chars.

REASONING FORMAT RULE:
- Provide exactly 1 punchy, natural sentence explaining the score.
- When referencing the anchor ("${anchor}"), write natural prose with proper spaces (e.g., "directly supports your target of ${anchor}").
- Never concatenate words or output awkward phrases like "anchor of[Goal]".`

  return {
    contents: [{ parts: [{ text: `Logged: "${rawAction}", Duration: ${duration} mins` }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          polished_title: { type: 'STRING' },
          category: { type: 'STRING' },
          effort_strain: { type: 'NUMBER' },
          anchor_alignment: { type: 'NUMBER' },
          reasoning: { type: 'STRING' },
        },
        required: ['polished_title', 'category', 'effort_strain', 'anchor_alignment', 'reasoning'],
      },
    },
  }
}

export function polishReasoning(reasoning: string) {
  return reasoning
    .replace(/of([A-Z])/g, 'of $1')
    .replace(/anchor of\s*/gi, 'anchor of ')
    .trim()
}
