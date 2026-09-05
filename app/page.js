'use client';

import { useState, useCallback } from 'react';
import VoiceRecorder from '@/components/VoiceRecorder';
import FeedbackCard from '@/components/FeedbackCard';
import LanguageSelector from '@/components/LanguageSelector';
import AudioPlayer from '@/components/AudioPlayer';
import ProgressPanel from '@/components/ProgressPanel';
import { useSessionHistory } from '@/hooks/useSessionHistory';

export default function Home() {
  const [selectedLang, setSelectedLang] = useState({ code: 'auto', label: 'Auto-detect', flag: '🌐' });
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const { sessions, addSession, clearHistory, stats } = useSessionHistory();

  // Called by VoiceRecorder once the user finishes speaking
  const handleTranscriptReady = useCallback(async (text) => {
    if (!text) return;

    setError('');
    setTranscript(text);
    setFeedback(null);
    setAnalyzing(true);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          languageCode: selectedLang.code === 'auto' ? '' : selectedLang.code,
          languageLabel: selectedLang.label,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setFeedback(data);

      // Persist this session to history
      addSession(text, data, selectedLang);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }, [selectedLang, addSession]);

  const handleReset = () => {
    setTranscript('');
    setFeedback(null);
    setError('');
  };

  const isProcessing = analyzing;

  return (
    <div className="page-wrapper">
      <div className="container">

        {/* ── Header ── */}
        <header className="header">
          <div className="header-inner">
            <div className="header-logo">🎙️</div>
            <div className="header-text">
              <h1>LanguageAI</h1>
              <p>AI-powered voice language tutor</p>
            </div>
            <ProgressPanel sessions={sessions} stats={stats} feedback={feedback} />
          </div>
        </header>

        {/* ── Language Selector ── */}
        <section className="lang-section">
          <div className="section-label">Target Language</div>
          <LanguageSelector selected={selectedLang} onSelect={setSelectedLang} disabled={isProcessing} />
        </section>

        {/* ── Voice Recorder ── */}
        <section className="recorder-section">
          <div className="section-label">Speak a Sentence</div>
          <VoiceRecorder
            onTranscriptReady={handleTranscriptReady}
            disabled={isProcessing}
            processingLabel="Analyzing with Gemini AI..."
            selectedLangCode={selectedLang.code}
          />
        </section>

        {/* ── Error ── */}
        {error && (
          <div className="error-alert" role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── Transcript ── */}
        {transcript && (
          <section className="transcript-section animate-in">
            <div className="section-label">What You Said</div>
            <div className="glass-card transcript-card">
              <div className="transcript-header">
                <span className="section-label" style={{ marginBottom: 0 }}>Transcript</span>
                {selectedLang.code !== 'auto' && (
                  <span className="transcript-lang-tag">
                    {selectedLang.flag} {selectedLang.label}
                  </span>
                )}
                {!isProcessing && (
                  <button
                    id="new-recording-btn"
                    onClick={handleReset}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      transition: 'var(--transition)',
                    }}
                    onMouseEnter={(e) => (e.target.style.borderColor = 'var(--purple-500)')}
                    onMouseLeave={(e) => (e.target.style.borderColor = 'var(--border)')}
                  >
                    ↺ New Recording
                  </button>
                )}
              </div>
              <p className="transcript-text">{transcript}</p>
            </div>
          </section>
        )}

        {/* ── Feedback ── */}
        {(feedback || analyzing) && (
          <section className="feedback-section animate-in">
            <div className="section-label">AI Feedback</div>
            <FeedbackCard feedback={feedback} loading={analyzing} />
          </section>
        )}

        {/* ── Audio Player (browser TTS) ── */}
        {feedback?.correctedSentence && (
          <section className="player-section animate-in">
            <div className="section-label">Listen &amp; Learn</div>
            <AudioPlayer
              text={feedback.correctedSentence}
              nativeText={feedback.nativePhrase}
              languageCode={
                feedback.detectedLanguageCode ||
                (selectedLang.code === 'auto' ? 'en-US' : selectedLang.code)
              }
              autoPlay={true}
            />
          </section>
        )}

      </div>
    </div>
  );
}
