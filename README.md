# LanguageAI — AI Voice Language Tutor

Speak a sentence in any language. LanguageAI transcribes your voice in the browser using the Web Speech API, sends the text to Gemini AI for grammar and vocabulary analysis, and reads back a corrected version with the browser's built-in Text-to-Speech engine. Past sessions are saved to `localStorage` so you can track your progress over time.

---

## Features

- **In-browser voice recording** — Uses the Web Speech API (no server-side STT). Live waveform visualizer and real-time transcript preview while you speak.
- **13 supported languages** — English, Spanish, French, German, Japanese, Hindi, Portuguese, Italian, Mandarin Chinese, Korean, Russian, Arabic, and Auto-detect mode.
- **Gemini AI grammar analysis** — Sends the transcript to Gemini AI and gets back a fluency score (1–10), a list of individual errors with explanations, a corrected sentence, and a native-speaker phrasing suggestion.
- **Browser Text-to-Speech playback** — Reads the corrected sentence aloud using `window.speechSynthesis` at a slower rate (0.85×) for learning. Supports play/pause and re-reading the native phrase.
- **Session history** — Every completed session is saved to `localStorage`. Tracks average score, best score, a 7-session trend sparkline, most common error type, and total session count.
- **Progress panel** — Compact stats panel in the header that expands to show the full session log.
- **Responsive layout** — Works on desktop and mobile. Glassmorphism design with CSS custom properties and smooth animations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | JavaScript (JSX) |
| LLM | Google Gemini AI via `@google/generative-ai` |
| Speech-to-Text | Web Speech API (`window.SpeechRecognition`) — browser-native, free |
| Text-to-Speech | Web Speech Synthesis API (`window.speechSynthesis`) — browser-native, free |
| Styling | Vanilla CSS with CSS custom properties, glassmorphism, and animations |
| Session storage | `localStorage` |
| Deployment | Vercel (recommended) |

> **No Google Cloud account required.** Both STT and TTS run entirely in the browser. The only API key you need is a free Gemini API key.

---

## Project Structure

```
ai-voice-tutor/
├── app/
│   ├── layout.js                   # Root layout, metadata, viewport config
│   ├── page.js                     # Main page — wires all components together
│   ├── globals.css                 # Full design system (tokens, components, animations)
│   ├── page.module.css             # Page-level layout styles
│   └── api/
│       └── analyze/
│           └── route.js            # POST /api/analyze — Gemini grammar analysis
├── components/
│   ├── VoiceRecorder.jsx           # Mic button, waveform canvas, Web Speech API
│   ├── FeedbackCard.jsx            # Displays Gemini score, errors, corrections, tip
│   ├── AudioPlayer.jsx             # Browser TTS playback (corrected + native phrase)
│   ├── LanguageSelector.jsx        # Language picker dropdown (13 languages)
│   ├── ProgressPanel.jsx           # Stats header + expandable session history
│   └── SessionHistory.jsx          # Full session log list
├── hooks/
│   └── useSessionHistory.js        # localStorage persistence + derived stats
├── .env.example                    # Template — copy to .env.local and add your key
├── .env.local                      # Your API keys (never committed — in .gitignore)
├── .gitignore
├── jsconfig.json
├── next.config.mjs
├── eslint.config.mjs
└── package.json
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-voice-tutor.git
cd ai-voice-tutor
npm install
```

### 2. Get a Gemini API key (free)

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **Create API key**
3. Copy the key

No credit card required. The Gemini Flash model used here is on the free tier.

### 3. Set up environment variables

Copy the example file and fill in your key:

```bash
cp .env.example .env.local
```

Then open `.env.local` and replace the placeholder:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

`.env.local` is already listed in `.gitignore` — it will never be committed.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in **Chrome or Edge**. The Web Speech API requires one of these browsers — Firefox and Safari do not fully support it.

---

## API Route

Only one server-side API route exists in this project. Both STT and TTS run in the browser.

### `POST /api/analyze`

Sends the transcribed text to Gemini AI and returns structured feedback.

**Request body:**

```json
{
  "transcript": "I has been going to the store yesterday.",
  "languageCode": "en-US",
  "languageLabel": "English"
}
```

**Response body:**

```json
{
  "score": 5,
  "isCorrect": false,
  "correctedSentence": "I went to the store yesterday.",
  "nativePhrase": "I made a trip to the store yesterday.",
  "detectedLanguageCode": "en-US",
  "errors": [
    {
      "type": "Grammar",
      "original": "I has been going",
      "correction": "I went",
      "explanation": "Use simple past tense for a completed action in the past."
    }
  ],
  "tip": "Use simple past tense (went, saw, ate) for actions that happened at a specific time in the past."
}
```

The route uses `@google/generative-ai` to call Gemini with a structured prompt that enforces JSON output. It strips markdown code fences from the response before parsing to handle any model formatting inconsistencies.

---

## How It Works (Data Flow)

```
User clicks mic
    |
VoiceRecorder — Web Speech API starts listening (browser-native, free)
    |  live transcript shown in real time
User clicks stop (or 60-second limit reached)
    |
page.js — POST /api/analyze  { transcript, languageCode }
    |
/api/analyze — Gemini AI returns structured JSON feedback
    |
FeedbackCard — renders score, errors, corrected sentence, tip
    |
AudioPlayer — window.speechSynthesis reads the corrected sentence aloud
    |
useSessionHistory — saves session to localStorage
    |
ProgressPanel — updates stats (avg score, best, sparkline, top error type)
```

---

## Design Decisions

### Web Speech API instead of Google Cloud STT

The Web Speech API runs entirely in the browser — no audio is uploaded to any server, there are no usage quotas, and no Google Cloud project or billing setup is needed. The trade-off is browser compatibility: Chrome and Edge support it well; Firefox and Safari do not.

### Browser TTS instead of Google Cloud TTS

`window.speechSynthesis` is free, has no API key requirements, and is available in all modern browsers. The quality is lower than Neural2 voices but is sufficient for language learning playback. The `AudioPlayer` component sets `rate` to `0.85` and `pitch` to `1.0` for a natural, learner-friendly pace.

### localStorage for session history

Sessions are stored in `localStorage` under the key `lingua_ai_sessions`. A maximum of 50 sessions is kept (oldest are dropped). This approach requires no database, no auth, and works entirely offline after the initial page load. The `useSessionHistory` hook derives aggregate stats (`avg`, `best`, `recent7`, `topError`) on every render from the raw sessions array.

### Gemini prompt engineering

The `/api/analyze` route sends a detailed system prompt that instructs Gemini to return a strict JSON object. The prompt includes the target language, the transcript, and explicit field definitions with types and constraints. A regex post-processing step strips any markdown code fences the model might add, ensuring reliable JSON parsing.

---

## Browser Requirements

| Browser | Recording | Playback |
|---|---|---|
| Chrome 90+ | Full support | Full support |
| Edge 90+ | Full support | Full support |
| Firefox | No Web Speech API | Playback works |
| Safari | Partial (iOS 15+) | Playback works |

---

## Known Limitations

- **60-second recording cap** — The timer stops recording at 60 seconds and submits whatever was transcribed. This is a practical limit of the Web Speech API's continuous mode.
- **Chrome and Edge only for recording** — Firefox and Safari lack full Web Speech API support. A fallback error message is shown to unsupported browser users.
- **No backend session storage** — Sessions are stored in the browser only. Clearing browser data or switching devices resets history.
- **TTS voice quality varies by OS** — The voices available through `speechSynthesis` depend on the operating system. High-quality voices are available on macOS and Windows 11; Android and older Windows versions may sound more robotic.
- **Gemini free tier rate limits** — The free tier allows 15 RPM and 1,500 requests per day. For production use with many concurrent users, consider a paid plan or request queuing.

---

## Deployment

### Vercel (recommended)

1. Push the repository to GitHub
2. Go to [https://vercel.com/new](https://vercel.com/new) and import the repository
3. Under **Environment Variables**, add:
   - `GEMINI_API_KEY` — your Gemini API key
4. Click **Deploy**

### Other platforms

This is a standard Next.js app and can be deployed anywhere Node.js is supported.

```bash
npm run build   # Build for production
npm start       # Serve the production build
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server on http://localhost:3000 |
| `npm run build` | Build production bundle |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Gemini API key for grammar analysis. Free at [aistudio.google.com](https://aistudio.google.com/app/apikey) |

---

## License

MIT
