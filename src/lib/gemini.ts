const MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3-flash-preview']

export interface ActionJudgment {
  polished_title: string
  category: string
  effort_strain: number
  isValidAnchorAction: boolean
  directAlignmentScore: number
  rejectionReason: string
  basePoints: number
  multiplier: number
  finalPoints: number
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

export function buildJudgmentPayload(anchor: string, rawAction: string, duration: number, history: string) {
  const systemPrompt = `You score one logged action against the user's anchor ("${anchor}"). Be strict about alignment. Still recognize productive effort.

ANCHOR CREDIT
- isValidAnchorAction is true only when this log is a direct, causal step toward the anchor. Hydration, light stretching, tidying, and other generic habits are false unless that habit IS the anchor.
- directAlignmentScore is 0–10. Use 8–10 for a strong direct advance. Use 6–7.99 for a solid direct advance. Use 4–5.99 for a direct advance at baseline. Use 1–3 when the effort does not move the anchor. Do not inflate.
- Vague logs ("worked out", "did some studying") stay at 3 or below unless they name a count, a weight, a distance, or a finished result.
- rejectionReason is one candid sentence when the action is not a direct advance or the score is under 4. Acknowledge the effort. Use an empty string when the action is a direct advance scored at 4 or higher.

POINTS
The app recomputes the payout. Still fill these fields:
- basePoints = round(effort_strain × 8 × (duration_minutes / 45)^0.45)
- multiplier = 2.0 when the action is a direct advance and the score is at least 8; 1.5 when it is direct and the score is at least 6; 1.0 when it is direct and the score is at least 4; otherwise 0.5
- finalPoints = max(5, round(basePoints × multiplier))
Never report 0. A direct log from 4 up to 6 earns the full base. Under 4, or a log that misses the anchor, earns half.

RECENT TRAINING CONTEXT:
${history || 'No previous history recorded yet.'}
Note progressive volume, recovery, or repetitive point farming in the reasoning. It does not raise alignment by itself.

TITLE
- NEVER copy the discipline anchor as the action title.
- Reflect what the user ACTUALLY logged: "${rawAction}".
- Convention: "[Duration/Metric] [Focus Area/Movement] [Partner/Context]"
- Example: "Push day at the gym with Brandon" + 60m => "60-Min Push Session w/ Brandon".
- NO filler words like "Completed", "Finished", or "Did". Title Case, max 42 chars.

REASONING
- Exactly 1 punchy sentence.
- When you name the anchor ("${anchor}"), write it as normal prose with spaces.
- Never concatenate words or output phrases like "anchor of[Goal]".`

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
          isValidAnchorAction: { type: 'BOOLEAN' },
          directAlignmentScore: { type: 'NUMBER' },
          rejectionReason: { type: 'STRING' },
          basePoints: { type: 'NUMBER' },
          multiplier: { type: 'NUMBER' },
          finalPoints: { type: 'NUMBER' },
          reasoning: { type: 'STRING' },
        },
        required: [
          'polished_title',
          'category',
          'effort_strain',
          'isValidAnchorAction',
          'directAlignmentScore',
          'rejectionReason',
          'basePoints',
          'multiplier',
          'finalPoints',
          'reasoning',
        ],
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
