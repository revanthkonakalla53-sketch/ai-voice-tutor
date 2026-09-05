'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'lingua_ai_sessions';
const MAX_SESSIONS = 50;

/**
 * Persists tutor sessions to localStorage.
 * Each session: { id, timestamp, transcript, correctedSentence, score, isCorrect, errors, language }
 */
export function useSessionHistory() {
  const [sessions, setSessions] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSessions(JSON.parse(raw));
    } catch {
      setSessions([]);
    }
  }, []);

  // Persist whenever sessions change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // storage quota exceeded — ignore
    }
  }, [sessions]);

  const addSession = useCallback((transcript, feedback, language) => {
    const session = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      transcript,
      correctedSentence: feedback.correctedSentence,
      score: feedback.score,
      isCorrect: feedback.isCorrect,
      errors: feedback.errors ?? [],
      language: language?.label ?? 'Unknown',
      languageFlag: language?.flag ?? '🌐',
    };
    setSessions((prev) => [session, ...prev].slice(0, MAX_SESSIONS));
  }, []);

  const clearHistory = useCallback(() => {
    setSessions([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Derived stats
  const stats = (() => {
    if (sessions.length === 0) return null;
    const scores = sessions.map((s) => s.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const best = Math.max(...scores);
    const recent7 = sessions.slice(0, 7).map((s) => s.score).reverse();
    const errorTypes = {};
    sessions.forEach((s) =>
      s.errors.forEach((e) => {
        errorTypes[e.type] = (errorTypes[e.type] || 0) + 1;
      })
    );
    const topError = Object.entries(errorTypes).sort((a, b) => b[1] - a[1])[0];
    return { avg: avg.toFixed(1), best, recent7, topError, total: sessions.length };
  })();

  return { sessions, addSession, clearHistory, stats };
}
