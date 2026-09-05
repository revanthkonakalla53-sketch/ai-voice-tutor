'use client';

import { useState } from 'react';

// Tiny SVG sparkline — no external deps
function Sparkline({ scores }) {
  if (!scores || scores.length < 2) return null;
  const W = 120, H = 36, pad = 4;
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 10);
  const range = max - min || 1;
  const pts = scores.map((s, i) => {
    const x = pad + (i / (scores.length - 1)) * (W - pad * 2);
    const y = H - pad - ((s - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  });
  const lastPt = pts[pts.length - 1].split(',');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <polyline
        points={pts.join(' ')}
        stroke="url(#spark-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Endpoint dot */}
      <circle cx={lastPt[0]} cy={lastPt[1]} r="3.5" fill="#06b6d4" />
    </svg>
  );
}

function scoreClass(s) {
  return s >= 8 ? 'high' : s >= 5 ? 'mid' : 'low';
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function SessionHistory({ sessions, stats, onClear }) {
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!sessions || sessions.length === 0) return null;

  return (
    <section className="history-section animate-in">
      {/* ── Section header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="section-label" style={{ marginBottom: 0 }}>
          Progress &amp; History
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setOpen((v) => !v)}
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
            {open ? '▲ Hide' : '▼ Show'} Sessions ({sessions.length})
          </button>
          {showConfirm ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => { onClear(); setShowConfirm(false); setOpen(false); }}
                style={{
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                  color: 'var(--red-400)', padding: '4px 10px', borderRadius: 'var(--radius-full)',
                  cursor: 'pointer', fontSize: '0.75rem',
                }}
              >
                Yes, clear
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', padding: '4px 10px', borderRadius: 'var(--radius-full)',
                  cursor: 'pointer', fontSize: '0.75rem',
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              title="Clear all history"
              style={{
                background: 'none', border: '1px solid var(--border)',
                color: 'var(--text-muted)', padding: '4px 10px', borderRadius: 'var(--radius-full)',
                cursor: 'pointer', fontSize: '0.75rem', transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => (e.target.style.color = 'var(--red-400)')}
              onMouseLeave={(e) => (e.target.style.color = 'var(--text-muted)')}
            >
              🗑 Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Stats strip ── */}
      {stats && (
        <div className="glass-card" style={{
          padding: '16px 20px', marginBottom: 12,
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 20,
        }}>
          {/* Sparkline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Score Trend (last {stats.recent7.length})
            </span>
            <Sparkline scores={stats.recent7} />
          </div>

          <div style={{ width: '1px', height: 40, background: 'var(--border)', flexShrink: 0 }} />

          {/* Avg score */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif',
              background: 'linear-gradient(90deg,var(--purple-400),var(--cyan-500))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {stats.avg}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Avg Score
            </div>
          </div>

          <div style={{ width: '1px', height: 40, background: 'var(--border)', flexShrink: 0 }} />

          {/* Best score */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--green-400)' }}>
              {stats.best}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Best
            </div>
          </div>

          <div style={{ width: '1px', height: 40, background: 'var(--border)', flexShrink: 0 }} />

          {/* Sessions count */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--blue-400)' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Sessions
            </div>
          </div>

          {/* Top error type */}
          {stats.topError && (
            <>
              <div style={{ width: '1px', height: 40, background: 'var(--border)', flexShrink: 0 }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--yellow-400)', textTransform: 'capitalize' }}>
                  {stats.topError[0]}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Common Error
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Session list ── */}
      {open && (
        <div className="history-list animate-in">
          {sessions.map((s) => (
            <div key={s.id} className="history-item">
              <div className={`history-score ${scoreClass(s.score)}`}>{s.score}</div>
              <div className="history-text">
                <div className="history-original" title={s.transcript}>
                  {s.languageFlag} {s.transcript}
                </div>
                {!s.isCorrect && s.correctedSentence && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--purple-400)', marginTop: 2,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    → {s.correctedSentence}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                  {s.errors.slice(0, 3).map((e, i) => (
                    <span key={i} style={{
                      fontSize: '0.62rem', padding: '1px 7px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(239,68,68,0.12)', color: 'var(--red-400)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      textTransform: 'capitalize',
                    }}>
                      {e.type}
                    </span>
                  ))}
                </div>
              </div>
              <div className="history-time">{relativeTime(s.timestamp)}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
