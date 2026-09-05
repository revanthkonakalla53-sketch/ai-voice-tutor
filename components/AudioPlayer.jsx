'use client';

import { useEffect, useRef, useState } from 'react';

// Maps BCP-47 codes to best available speechSynthesis voice hint
const LANG_VOICE_MAP = {
  'en-US': 'en-US', 'en-GB': 'en-GB',
  'es-ES': 'es-ES', 'es-US': 'es-US',
  'fr-FR': 'fr-FR', 'de-DE': 'de-DE',
  'ja-JP': 'ja-JP', 'hi-IN': 'hi-IN',
  'pt-BR': 'pt-BR', 'it-IT': 'it-IT',
  'zh-CN': 'zh-CN', 'ko-KR': 'ko-KR',
  'ru-RU': 'ru-RU', 'ar-SA': 'ar-SA',
};

export default function AudioPlayer({ text, nativeText, languageCode, autoPlay = true }) {
  const [playing, setPlaying] = useState(false);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'corrected' | 'native'
  const [supported, setSupported] = useState(true);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (!window.speechSynthesis) {
      setSupported(false);
      return;
    }

    if (text && autoPlay) {
      speak();
    }

    return () => {
      window.speechSynthesis?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const getVoice = (langCode) => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const targetLang = LANG_VOICE_MAP[langCode] || langCode || 'en-US';
    const baseLang = targetLang.split('-')[0].toLowerCase();

    // Prefer exact match with "natural" or "neural" in name
    let voice =
      voices.find((v) => v.lang === targetLang && /natural|neural|enhanced/i.test(v.name)) ||
      voices.find((v) => v.lang === targetLang) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(baseLang)) ||
      null;

    return voice;
  };

  const speakUtterance = (speakText, onDone) => {
    if (!window.speechSynthesis || !speakText) return;

    const utterance = new SpeechSynthesisUtterance(speakText);
    utteranceRef.current = utterance;

    const voice = getVoice(languageCode);
    if (voice) utterance.voice = voice;

    utterance.lang = LANG_VOICE_MAP[languageCode] || languageCode || 'en-US';
    utterance.rate = 0.88;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => { if (onDone) onDone(); };
    utterance.onerror = () => { setPlaying(false); setPhase('idle'); };

    const trySpeak = () => {
      const v = getVoice(languageCode);
      if (v) utterance.voice = v;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = trySpeak;
    } else {
      trySpeak();
    }
  };

  const speak = () => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    setPlaying(true);
    setPhase('corrected');

    speakUtterance(text, () => {
      if (nativeText) {
        // Short pause, then announce the section label in English
        setTimeout(() => {
          // Speak the label "How a native speaker might say it" in English
          const label = new SpeechSynthesisUtterance('How a native speaker might say it:');
          label.lang = 'en-US';
          label.rate = 0.9;
          label.pitch = 1;
          label.volume = 1;
          // Pick an English voice if available
          const voices = window.speechSynthesis.getVoices();
          const enVoice = voices.find(v => v.lang === 'en-US') || null;
          if (enVoice) label.voice = enVoice;

          label.onend = () => {
            // Short pause after announcement, then play native phrase
            setTimeout(() => {
              setPhase('native');
              speakUtterance(nativeText, () => {
                setPlaying(false);
                setPhase('idle');
              });
            }, 300);
          };
          label.onerror = () => {
            // Fallback: play native phrase even if label fails
            setPhase('native');
            speakUtterance(nativeText, () => {
              setPlaying(false);
              setPhase('idle');
            });
          };

          window.speechSynthesis.speak(label);
        }, 600);
      } else {
        setPlaying(false);
        setPhase('idle');
      }
    });
  };

  const handlePlayPause = () => {
    if (!window.speechSynthesis) return;
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      setPhase('idle');
    } else {
      speak();
    }
  };

  const handleReplay = () => {
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setPhase('idle');
    setTimeout(() => speak(), 100);
  };

  if (!supported) return null;
  if (!text) return null;

  const phaseLabel = phase === 'corrected'
    ? '🔊 Playing: Corrected Version'
    : phase === 'native'
    ? '🗣️ Playing: Native Speaker Version'
    : '🔊 Listen to Both Versions';

  const currentText = phase === 'native' ? nativeText : text;

  return (
    <div className="glass-card player-card">
      {/* Play/Pause */}
      <button
        id="audio-play-btn"
        className={`play-btn ${playing ? 'playing' : ''}`}
        onClick={handlePlayPause}
        aria-label={playing ? 'Pause' : 'Play both versions'}
        title={playing ? 'Pause' : 'Play both versions'}
      >
        {playing ? '⏸️' : '▶️'}
      </button>

      {/* Info */}
      <div className="player-info">
        <div className="player-title">{phaseLabel}</div>
        <div className="player-text" style={{ transition: 'opacity 0.3s' }}>
          &ldquo;{phase === 'idle' ? text : currentText}&rdquo;
        </div>
        {nativeText && phase === 'idle' && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Plays corrected → then native speaker version
          </div>
        )}
        {playing && (
          <div className="player-progress">
            <div
              className="player-progress-bar"
              style={{ width: '100%', animation: 'shimmer 1.5s infinite' }}
            />
          </div>
        )}
      </div>

      {/* Replay */}
      <button
        id="audio-replay-btn"
        onClick={handleReplay}
        title="Replay"
        aria-label="Replay audio"
        style={{
          background: 'none',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          width: 36,
          height: 36,
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'var(--transition)',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--green-500)';
          e.currentTarget.style.color = 'var(--green-400)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
      >
        🔁
      </button>
    </div>
  );
}
