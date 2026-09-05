'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

export default function VoiceRecorder({ onTranscriptReady, disabled, processingLabel, selectedLangCode }) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [hasSupport, setHasSupport] = useState(true);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setHasSupport(false);
  }, []);

  // Real-time waveform
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#8b5cf6');
      gradient.addColorStop(0.5, '#60a5fa');
      gradient.addColorStop(1, '#8b5cf6');

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = gradient;
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };
    draw();
  }, []);

  const stopWaveform = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (disabled) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    // Setup waveform via mic stream
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      drawWaveform();
    } catch (_) {
      // waveform optional — continue without it
    }

    const recognition = new SR();
    recognitionRef.current = recognition;

    // Set language — Web Speech API uses BCP-47 codes
    const langCode = (!selectedLangCode || selectedLangCode === 'auto') ? '' : selectedLangCode;
    if (langCode) recognition.lang = langCode;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalText = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t + ' ';
        else interim += t;
      }
      setLiveTranscript((finalText + interim).trim());
    };

    recognition.onerror = (e) => {
      if (e.error === 'no-speech') return;
      console.error('SpeechRecognition error:', e.error);
      stopRecording(finalText);
    };

    recognition.onend = () => {
      // Only fire callback if we have text and are still recording (user stopped)
      // onend fires automatically — handled by stopRecording
    };

    recognition.start();
    setIsRecording(true);
    setSeconds(0);
    setLiveTranscript('');

    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s >= 59) {
          stopRecording(finalText);
          return s;
        }
        return s + 1;
      });
    }, 1000);

    // Keep a ref to finalText accumulator via closure update trick
    recognition._getFinalText = () => finalText;
  }, [disabled, selectedLangCode, drawWaveform]);

  const stopRecording = useCallback((overrideFinalText) => {
    const rec = recognitionRef.current;
    let text = overrideFinalText;

    if (rec) {
      if (typeof rec._getFinalText === 'function' && text === undefined) {
        text = rec._getFinalText();
      }
      try { rec.stop(); } catch (_) {}
      recognitionRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    setSeconds(0);
    stopWaveform();

    // Get current live transcript as fallback
    setLiveTranscript((current) => {
      const finalTranscript = (text || current || '').trim();
      if (finalTranscript) {
        // Defer parent state update to avoid calling setState during render
        setTimeout(() => onTranscriptReady(finalTranscript), 0);
      }
      return finalTranscript;
    });
  }, [onTranscriptReady, stopWaveform]);

  const handleMicClick = () => {
    if (disabled) return;
    if (isRecording) stopRecording(undefined);
    else startRecording();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (_) {} }
      stopWaveform();
    };
  }, [stopWaveform]);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const micClass = ['mic-btn', isRecording ? 'recording' : '', disabled ? 'processing' : ''].filter(Boolean).join(' ');
  const statusClass = ['mic-status', isRecording ? 'recording' : '', disabled ? 'processing' : ''].filter(Boolean).join(' ');
  const wrapperClass = ['mic-ring-container', isRecording ? 'recording' : ''].join(' ');

  if (!hasSupport) {
    return (
      <div className="glass-card recorder-card">
        <div className="error-alert">
          <span>⚠️</span>
          <span>
            Your browser does not support the Web Speech API. Please use <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card recorder-card">
      <div className="mic-button-wrapper">
        {/* Mic with ripple rings */}
        <div className={wrapperClass}>
          <div className="mic-ring" />
          <div className="mic-ring" />
          <div className="mic-ring" />
          <button
            id="mic-button"
            className={micClass}
            onClick={handleMicClick}
            disabled={disabled}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {disabled ? '⚙️' : isRecording ? '⏹️' : '🎤'}
          </button>
        </div>

        <p className={statusClass}>
          {disabled
            ? processingLabel || 'Processing...'
            : isRecording
            ? 'Listening... click to stop'
            : 'Click to start speaking'}
        </p>

        <div className="recording-timer">{isRecording ? formatTime(seconds) : ''}</div>

        {/* Live transcript while recording */}
        {isRecording && liveTranscript && (
          <div style={{
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            borderRadius: 'var(--radius)',
            padding: '10px 16px',
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            maxWidth: 500,
            width: '100%',
            fontStyle: 'italic',
            transition: 'all 0.2s',
          }}>
            "{liveTranscript}"
          </div>
        )}

        {/* Waveform */}
        <canvas
          ref={canvasRef}
          className={`waveform-canvas ${isRecording ? 'visible' : ''}`}
          width={500}
          height={64}
          aria-hidden="true"
        />

        {!isRecording && !disabled && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Works in Chrome &amp; Edge · Max 60 seconds · Speak clearly
          </p>
        )}
      </div>
    </div>
  );
}
