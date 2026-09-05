# LinguaAI — AI Voice Language Tutor

> **Project 4 — Intermediate Track**  
> A learner speaks a sentence in any language; the app transcribes it, checks grammar and word choice with Gemini AI, and speaks back a corrected version.

> **Note:** This project was built with the assistance of an AI coding assistant (Google Antigravity / Gemini).

---

## 🚀 Live Demo

Deploy link here after Vercel deployment.

---

## ✨ Features

- 🎙️ **Voice Recording** — In-browser mic recording with real-time waveform visualizer
- 🌐 **Auto Language Detection** — Supports 13 languages (English, Spanish, French, German, Japanese, Hindi, Portuguese, Italian, Chinese, Korean, Russian, Arabic, and more)
- 🤖 **Gemini AI Analysis** — Grammar corrections, vocabulary improvements, fluency score (1–10), and friendly explanations
- 🔊 **Text-to-Speech Playback** — Google Neural2 voices read back the corrected sentence at a natural learning pace
- 📊 **Detailed Feedback** — Error-by-error breakdown with original/corrected comparison and actionable tips
- 💡 **Native Speaker Phrasing** — Suggests how a native speaker would naturally say the sentence
- 📱 **Responsive UI** — Works on desktop and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| LLM | Google Gemini 1.5 Flash |
| Speech-to-Text | Google Cloud Speech-to-Text v1 |
| Text-to-Speech | Google Cloud Text-to-Speech v1 (Neural2 voices) |
| Styling | Vanilla CSS with glassmorphism + animations |
| Deployment | Vercel |

---

## ⚙️ Setup (Local)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-voice-tutor.git
cd ai-voice-tutor
npm install
```

### 2. Get your API keys

#### Gemini API Key (free)
1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **"Create API key"**
3. Copy the key

#### Google Cloud API Key (for STT + TTS)
1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services -> Library**
4. Enable **"Cloud Speech-to-Text API"**
5. Enable **"Cloud Text-to-Speech API"**
6. Go to **APIs & Services -> Credentials**
7. Click **"Create Credentials -> API key"**
8. Copy the key

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key_here
```

Never commit `.env.local` to GitHub. It is already in `.gitignore`.

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## 🌐 Deployment (Vercel)

### Option A — Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts. When asked about environment variables, add both keys.

### Option B — Vercel Dashboard (recommended)

1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Before deploying, go to **"Environment Variables"** and add:
   - `GEMINI_API_KEY` = your Gemini key
   - `GOOGLE_CLOUD_API_KEY` = your Google Cloud key
5. Click **Deploy**

---

## 📐 Architecture

```
User speaks -> Browser MediaRecorder
    |
/api/transcribe -> Google Cloud STT
    | transcript + language
/api/analyze -> Gemini 1.5 Flash (structured JSON prompt)
    | score, errors, corrections, tip
/api/speak -> Google Cloud TTS (Neural2 voice)
    | MP3 audio blob
Browser AudioPlayer -> plays corrected sentence
```

### API Routes

| Route | Method | Description |
|---|---|---|
| `/api/transcribe` | POST | Converts audio blob to text via Google STT |
| `/api/analyze` | POST | Sends transcript to Gemini, returns structured feedback JSON |
| `/api/speak` | POST | Converts corrected text to MP3 via Google TTS |

---

## 🎯 Approach and Design Decisions

### Why Gemini 1.5 Flash?
- Free tier with generous rate limits
- Fast inference (~1-2s) suitable for interactive use
- Excellent multilingual grammar understanding
- Structured JSON output via prompt engineering (no function calling needed)

### Why Google Cloud STT?
- Supports 125+ languages with the `languageCode` parameter
- `alternativeLanguageCodes` enables auto-detection across multiple languages
- `latest_long` model gives best accuracy for conversational speech
- `WEBM_OPUS` encoding works directly with browser MediaRecorder output

### Why server-side API routes?
- API keys are never exposed to the browser
- CORS is handled automatically
- Audio processing (base64 encoding) happens server-side

### Error Handling
- STT: Handles no-speech, low-confidence, and API errors gracefully
- Gemini: JSON parsing fallback with regex extraction if model wraps in markdown
- TTS: Non-blocking — feedback is still shown even if TTS fails
- Each step shows user-friendly error messages in the UI

---

## Known Limitations

1. **60-second recording limit** — Google STT synchronous recognize supports up to 1 minute. For longer recordings, longrunningrecognize would be needed.
2. **Browser mic support** — Requires a modern browser (Chrome, Firefox, Edge). Safari may have limited WebM support.
3. **STT accuracy** — Background noise and accents can reduce accuracy. The `useEnhanced: true` model mitigates this.
4. **Rate limits** — Free tier Gemini API has rate limits. For production use, consider request queuing.
5. **TTS voice availability** — Not all languages have Neural2 voices. Falls back to standard voices automatically.

---

## 🏆 Stretch Goal: Session Tracking

A future enhancement could:
- Store sessions in localStorage or a database (e.g., Firestore)
- Show progress over time (score trend chart)
- Adapt difficulty by tracking common error types per user

---

## 📁 Project Structure

```
ai-voice-tutor/
├── app/
│   ├── page.js                  # Main UI page
│   ├── layout.js                # Root layout + SEO metadata
│   ├── globals.css              # Design system
│   └── api/
│       ├── transcribe/route.js  # Google STT endpoint
│       ├── analyze/route.js     # Gemini LLM endpoint
│       └── speak/route.js       # Google TTS endpoint
├── components/
│   ├── VoiceRecorder.jsx        # Mic + waveform
│   ├── FeedbackCard.jsx         # AI feedback display
│   ├── LanguageSelector.jsx     # Language picker
│   └── AudioPlayer.jsx          # TTS playback
├── .env.local                   # API keys (not committed)
├── .env.example                 # Template
└── README.md
```
