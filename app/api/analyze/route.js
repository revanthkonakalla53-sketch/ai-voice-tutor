import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Retry helper with exponential backoff for 503 / 429 transient errors
async function generateWithRetry(model, prompt, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await model.generateContent(prompt);
    } catch (err) {
      const isRetryable =
        err.message?.includes('503') ||
        err.message?.includes('429') ||
        err.message?.includes('high demand') ||
        err.message?.includes('overloaded');

      if (isRetryable && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.warn(`Gemini attempt ${attempt + 1} failed (retryable). Retrying in ${delay}ms…`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

export async function POST(request) {
  try {
    const { transcript, languageCode, languageLabel } = await request.json();

    if (!transcript) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured. Please add it to your .env.local file.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    // Build a language hint for the prompt
    const langHint = languageLabel && languageLabel !== 'Auto-detect'
      ? `User's selected language: ${languageLabel} (BCP-47: ${languageCode})`
      : 'Language not specified — detect it automatically from the transcript.';

    const prompt = `You are "Maya", a highly skilled multilingual language tutor and linguist with 20+ years of experience teaching languages including English, Telugu (తెలుగు), Hindi, Spanish, French, and many others.

A learner just spoke the following sentence aloud. It was captured via speech-to-text:

TRANSCRIPT: "${transcript}"

${langHint}

══════════════════════════════════════════
STEP 1 — LANGUAGE DETECTION (internal reasoning, do NOT output this step)
══════════════════════════════════════════
First, silently identify the primary language of the transcript by analysing its script, vocabulary, and grammar. Do NOT rely solely on the user's selected language — trust the transcript content.

Examples:
- If the transcript contains Telugu script (e.g., మీరు, నేను, ఏమి) or Telugu romanisation → language is Telugu
- If the transcript is in English words/grammar → language is English
- If it is a mix, treat the dominant language as the target language

══════════════════════════════════════════
STEP 2 — ANALYSIS
══════════════════════════════════════════
Analyse the transcript for:
1. Grammar errors (tense, subject-verb agreement, articles, prepositions, word order, etc.)
2. Word choice / vocabulary issues (unnatural phrasing, Anglicisms in non-English text, etc.)
3. Fluency issues (awkward phrasing that a native speaker would not use)
4. Pronunciation hints (if the speech-to-text text suggests a mispronunciation pattern)

══════════════════════════════════════════
STEP 3 — RESPOND IN THE SAME LANGUAGE
══════════════════════════════════════════
**CRITICAL RULE**: ALL output text — including correctedSentence, error explanations, tips, examples, pronunciationNote, and nativePhrase — MUST be written in the SAME LANGUAGE as the transcript.

- If the learner spoke in Telugu → write everything in Telugu (use Telugu script; you may add English terms in parentheses for technical grammar terms only).
- If the learner spoke in English → write everything in English.
- If the learner spoke in Hindi → write everything in Hindi.
- Apply this rule consistently for every language.

Do NOT translate the learner's sentence into another language. Do NOT give English feedback for a Telugu sentence.

══════════════════════════════════════════
STEP 4 — OUTPUT FORMAT
══════════════════════════════════════════
Return ONLY a valid JSON object with NO markdown, NO code fences, NO extra text — just raw JSON:

{
  "detectedLanguage": "<the language you detected, e.g. 'Telugu', 'English', 'Hindi'>",
  "detectedLanguageCode": "<BCP-47 code, e.g. 'te-IN', 'en-US', 'hi-IN'>",
  "correctedSentence": "<The fully corrected, natural, native-sounding version — written in the SAME language as the transcript>",
  "score": <integer 1–10 judging correctness and naturalness in the detected language>,
  "isCorrect": <true only if the original has zero errors>,
  "difficultyLevel": "<easy|medium|hard>",
  "errors": [
    {
      "type": "<grammar | verb-tense | subject-verb-agreement | postposition | word-choice | spelling | word-order | fluency | sandhi | honorific>",
      "original": "<the exact incorrect word/phrase from the transcript>",
      "corrected": "<the correct replacement>",
      "explanation": "<2–3 sentence explanation written in the SAME language as the transcript: (1) the rule that was broken, (2) why the original is wrong, (3) a memory tip. For Telugu errors, cite the Telugu grammatical rule (e.g., విభక్తి, సంధి, కాలం) in Telugu script where possible.>",
      "example": "<A new example sentence in the SAME language correctly using the corrected form.>"
    }
  ],
  "pronunciationNote": "<1-sentence tip in the SAME language if a pronunciation pattern is evident, else null>",
  "tip": "<1–2 sentences of warm, encouraging personalised feedback written in the SAME language. Mention one thing done well and one actionable practice suggestion.>",
  "nativePhrase": "<A more natural/idiomatic version a fluent native speaker would say in casual speech, in the SAME language — only if meaningfully different from correctedSentence, else null>"
}

══════════════════════════════════════════
SCORING GUIDE
══════════════════════════════════════════
Score the sentence relative to native-speaker norms in the detected language:
- 10 → Perfect, no changes needed
- 8–9 → Very minor stylistic tweaks only
- 6–7 → 1–2 errors, meaning is clear
- 4–5 → 3–4 errors, meaning is partially clear
- 2–3 → Many errors, hard to understand
- 1  → Mostly incomprehensible

══════════════════════════════════════════
STRICT RULES
══════════════════════════════════════════
- "errors" MUST be [] if score is 10 (no errors)
- Limit to the top 4 most impactful errors
- NEVER be discouraging — frame every correction as a learning opportunity
- For Telugu: use correct Telugu script in all text fields; romanisation only in parentheses if helpful
- ONLY output the raw JSON object — absolutely nothing else before or after it`;

    const result = await generateWithRetry(model, prompt);
    const text = result.response.text().trim();

    // Strip markdown code fences if the model wraps the response
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: extract JSON object from response
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Could not parse Gemini response as JSON');
      }
    }

    // Validate and sanitize response fields
    return NextResponse.json({
      detectedLanguage: parsed.detectedLanguage || languageLabel || 'Unknown',
      detectedLanguageCode: parsed.detectedLanguageCode || languageCode || 'en-US',
      correctedSentence: parsed.correctedSentence || transcript,
      score: Math.min(10, Math.max(1, Number(parsed.score) || 7)),
      isCorrect: Boolean(parsed.isCorrect),
      difficultyLevel: ['easy', 'medium', 'hard'].includes(parsed.difficultyLevel)
        ? parsed.difficultyLevel
        : 'medium',
      errors: Array.isArray(parsed.errors)
        ? parsed.errors.slice(0, 4).map((e) => ({
            type: e.type || 'grammar',
            original: e.original || '',
            corrected: e.corrected || '',
            explanation: e.explanation || '',
            example: e.example || null,
          }))
        : [],
      pronunciationNote: parsed.pronunciationNote || null,
      tip: parsed.tip || "Keep practising — you're making great progress!",
      nativePhrase: parsed.nativePhrase || null,
    });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: `Analysis failed: ${error.message}` }, { status: 500 });
  }
}
