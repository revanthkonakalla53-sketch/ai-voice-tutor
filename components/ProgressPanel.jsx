'use client';

import { useState } from 'react';

// ── SVG Sparkline ──────────────────────────────────────────────────────────────
function Sparkline({ scores }) {
  if (!scores || scores.length < 2) return (
    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', padding: '8px 0' }}>
      Need at least 2 sessions to show trend.
    </div>
  );
  const W = 260, H = 64, pad = 6;
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 10);
  const range = max - min || 1;
  const pts = scores.map((s, i) => {
    const x = pad + (i / (scores.length - 1)) * (W - pad * 2);
    const y = H - pad - ((s - min) / range) * (H - pad * 2);
    return { x, y, s };
  });
  const polyPts = pts.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = `M${pts[0].x},${H} ` +
    pts.map(p => `L${p.x},${p.y}`).join(' ') +
    ` L${pts[pts.length - 1].x},${H} Z`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" style={{ overflow: 'visible', width: '100%' }}>
      <defs>
        <linearGradient id="pg-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="pg-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[2, 5, 8, 10].map(v => {
        const y = H - pad - ((v - min) / range) * (H - pad * 2);
        return (
          <line key={v} x1={pad} y1={y} x2={W - pad} y2={y}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        );
      })}
      <path d={areaPath} fill="url(#pg-area)" />
      <polyline points={polyPts} stroke="url(#pg-grad)" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3}
          fill={i === pts.length - 1 ? '#06b6d4' : '#8b5cf6'}
          stroke="#07080f" strokeWidth="2" />
      ))}
    </svg>
  );
}

// ── Error bar ──────────────────────────────────────────────────────────────────
function ErrorBar({ label, count, max }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  const color = pct > 66 ? '#ef4444' : pct > 33 ? '#facc15' : '#10b981';
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{label}</span>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color }}>{count}×</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 999,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
}

// ── Stat pill ──────────────────────────────────────────────────────────────────
function StatPill({ label, value, color, icon }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '10px 16px', minWidth: 60, flex: 1,
    }}>
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color }}>
        {value}
      </span>
      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'center' }}>
        {label}
      </span>
    </div>
  );
}

// ── Difficulty badge ───────────────────────────────────────────────────────────
function DifficultyBadge({ level }) {
  const cfg = {
    easy:   { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)',  icon: '🟢' },
    medium: { color: '#facc15', bg: 'rgba(250,204,21,0.12)',  border: 'rgba(250,204,21,0.3)',  icon: '🟡' },
    hard:   { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', icon: '🔴' },
  }[level] || { color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', icon: '⚪' };
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
      borderRadius: 999, background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`, textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {cfg.icon} {level || 'N/A'}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ProgressPanel({ sessions, stats, feedback }) {
  const [open, setOpen] = useState(false);

  const hasData = sessions && sessions.length > 0;

  const langBreakdown = (() => {
    if (!hasData) return [];
    const map = {};
    sessions.forEach(s => { const l = s.language || 'Unknown'; map[l] = (map[l] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  })();

  const recentTrend = (() => {
    if (!stats || !stats.recent7 || stats.recent7.length < 2) return null;
    const diff = stats.recent7[stats.recent7.length - 1] - stats.recent7[0];
    return { diff, improving: diff >= 0 };
  })();

  const difficultyDist = (() => {
    const map = { easy: 0, medium: 0, hard: 0 };
    if (hasData) sessions.forEach(s => { if (s.difficultyLevel) map[s.difficultyLevel]++; });
    return map;
  })();

  const errorTypeCounts = (() => {
    if (!hasData) return [];
    const map = {};
    sessions.forEach(s => (s.errors || []).forEach(e => { map[e.type] = (map[e.type] || 0) + 1; }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  })();
  const maxErrCount = errorTypeCounts[0]?.[1] || 1;

  const suggestedDifficulty = (() => {
    if (!stats) return null;
    const avg = parseFloat(stats.avg);
    if (avg >= 8.5) return { level: 'hard',   msg: "You're excelling! Challenge yourself with harder, more complex sentences." };
    if (avg >= 6)   return { level: 'medium', msg: 'Good progress! Keep practising medium-complexity sentences to push your skills.' };
    return { level: 'easy', msg: 'Focus on building fundamentals — short, clear sentences work best right now.' };
  })();

  let streak = 0;
  if (hasData) { for (const s of sessions) { if (s.score >= 7) streak++; else break; } }

  const cardStyle = {
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14, padding: '14px 16px',
  };

  return (
    <>
      {/* ── Trigger Button ───────────────────────────────── */}
      <button
        id="progress-panel-btn"
        onClick={() => setOpen(true)}
        title="View your learning progress"
        style={{
          display: 'flex', alignItems: 'center', gap: 8, position: 'relative',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(6,182,212,0.12))',
          border: '1px solid rgba(139,92,246,0.38)', color: 'var(--purple-300)',
          padding: '9px 18px', borderRadius: 'var(--radius-full)', cursor: 'pointer',
          fontSize: '0.82rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif',
          letterSpacing: '0.03em', backdropFilter: 'blur(12px)',
          transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '0 4px 20px rgba(139,92,246,0.15)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg,rgba(139,92,246,0.32),rgba(6,182,212,0.22))';
          e.currentTarget.style.borderColor = 'rgba(139,92,246,0.7)';
          e.currentTarget.style.boxShadow = '0 6px 28px rgba(139,92,246,0.3)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg,rgba(139,92,246,0.18),rgba(6,182,212,0.12))';
          e.currentTarget.style.borderColor = 'rgba(139,92,246,0.38)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(139,92,246,0.15)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <span style={{ fontSize: '1rem' }}>📊</span>
        <span>Progress</span>
        {streak >= 3 && (
          <span style={{
            fontSize: '0.62rem', background: 'rgba(250,204,21,0.18)', color: '#facc15',
            border: '1px solid rgba(250,204,21,0.3)', borderRadius: 999, padding: '1px 7px', fontWeight: 700,
          }}>
            🔥 {streak}
          </span>
        )}
        {hasData && (
          <span style={{
            position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%',
            background: 'var(--cyan-500)', boxShadow: '0 0 8px rgba(6,182,212,0.9)',
          }} />
        )}
      </button>

      {/* ── Backdrop ─────────────────────────────────────── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 998,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            animation: 'ppFadeIn 0.2s ease',
          }}
        />
      )}

      {/* ── Slide-in Drawer ──────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 999,
        width: 'clamp(300px, 420px, 92vw)',
        background: 'linear-gradient(160deg,#0e0f20 0%,#0a0b18 100%)',
        borderLeft: '1px solid rgba(139,92,246,0.18)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
        transform: open ? 'translateX(0)' : 'translateX(105%)',
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>

        {/* Drawer header */}
        <div style={{
          padding: '22px 22px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(135deg,rgba(139,92,246,0.08),rgba(6,182,212,0.04))',
          position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(16px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.4rem' }}>📊</span>
              <div>
                <div style={{
                  fontSize: '1.05rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif',
                  background: 'linear-gradient(90deg,var(--purple-300),var(--cyan-500))',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                  Learning Progress
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>
                  {hasData ? `${sessions.length} session${sessions.length > 1 ? 's' : ''} tracked across all languages` : 'No sessions yet'}
                </div>
              </div>
            </div>
            <button
              id="progress-panel-close"
              onClick={() => setOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-muted)', width: 32, height: 32, borderRadius: '50%',
                cursor: 'pointer', fontSize: '1rem', display: 'flex',
                alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >✕</button>
          </div>
        </div>

        {/* Drawer body */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>

          {!hasData ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 14, color: 'var(--text-muted)', textAlign: 'center', padding: '60px 0',
            }}>
              <span style={{ fontSize: '3.5rem', opacity: 0.35 }}>🎙️</span>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 6 }}>No sessions yet</div>
                <div style={{ fontSize: '0.78rem', lineHeight: 1.6 }}>
                  Start speaking to automatically track<br />your language learning progress!
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Overview stats */}
              <section>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 9 }}>Overview</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <StatPill icon="⭐" label="Avg Score" value={stats?.avg ?? '—'} color="var(--purple-400)" />
                  <StatPill icon="🏆" label="Best"      value={stats?.best ?? '—'} color="var(--green-400)" />
                  <StatPill icon="📝" label="Sessions"  value={stats?.total ?? 0}  color="var(--blue-400)" />
                  {streak > 0 && <StatPill icon="🔥" label="Streak" value={streak} color="#facc15" />}
                </div>
              </section>

              {/* Trend pill */}
              {recentTrend && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                  borderRadius: 12,
                  background: recentTrend.improving ? 'rgba(52,211,153,0.07)' : 'rgba(248,113,113,0.07)',
                  border: `1px solid ${recentTrend.improving ? 'rgba(52,211,153,0.22)' : 'rgba(248,113,113,0.22)'}`,
                }}>
                  <span style={{ fontSize: '1.1rem' }}>{recentTrend.improving ? '📈' : '📉'}</span>
                  <span style={{ fontSize: '0.76rem', color: recentTrend.improving ? '#34d399' : '#f87171', fontWeight: 600 }}>
                    {recentTrend.improving
                      ? `+${recentTrend.diff.toFixed(1)} pts improvement over last ${stats.recent7.length} sessions`
                      : `${recentTrend.diff.toFixed(1)} pts — keep practising, you'll get there!`}
                  </span>
                </div>
              )}

              {/* Score trend chart */}
              <section>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 9 }}>
                  Score Trend (last {stats?.recent7?.length || 0})
                </div>
                <div style={cardStyle}>
                  <Sparkline scores={stats?.recent7 || []} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>Oldest →</span>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>← Latest</span>
                  </div>
                </div>
              </section>

              {/* Adapted difficulty */}
              {suggestedDifficulty && (
                <section>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 9 }}>
                    Adapted Difficulty
                  </div>
                  <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Recommended:</span>
                      <DifficultyBadge level={suggestedDifficulty.level} />
                    </div>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 12 }}>
                      {suggestedDifficulty.msg}
                    </p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['easy', 'medium', 'hard'].map(d => {
                        const total = sessions.length || 1;
                        const pct = Math.round((difficultyDist[d] / total) * 100);
                        const color = d === 'easy' ? '#34d399' : d === 'medium' ? '#facc15' : '#f87171';
                        return (
                          <div key={d} style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.07)', marginBottom: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999, transition: 'width 0.8s ease' }} />
                            </div>
                            <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{d} {pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}

              {/* Error breakdown */}
              {errorTypeCounts.length > 0 && (
                <section>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 9 }}>
                    Common Error Types
                  </div>
                  <div style={cardStyle}>
                    {errorTypeCounts.map(([type, count]) => (
                      <ErrorBar key={type} label={type} count={count} max={maxErrCount} />
                    ))}
                    <p style={{ fontSize: '0.69rem', color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.55 }}>
                      💡 Focus on <strong style={{ color: 'var(--text-secondary)' }}>{errorTypeCounts[0]?.[0]}</strong> — it&apos;s your most common mistake.
                    </p>
                  </div>
                </section>
              )}

              {/* Language breakdown */}
              {langBreakdown.length > 0 && (
                <section>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 9 }}>
                    Languages Practised
                  </div>
                  <div style={cardStyle}>
                    {langBreakdown.map(([lang, count]) => (
                      <div key={lang} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{lang}</span>
                        <span style={{
                          fontSize: '0.67rem', fontWeight: 700, padding: '2px 10px', borderRadius: 999,
                          background: 'rgba(139,92,246,0.12)', color: 'var(--purple-300)',
                          border: '1px solid rgba(139,92,246,0.2)',
                        }}>
                          {count} session{count > 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Current session highlight */}
              {feedback && (
                <section>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 9 }}>
                    This Session
                  </div>
                  <div style={{
                    ...cardStyle,
                    background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: `conic-gradient(var(--purple-500) ${feedback.score * 36}deg, rgba(255,255,255,0.06) 0)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.9rem', fontWeight: 800, fontFamily: 'Outfit',
                      }}>
                        {feedback.score}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {feedback.isCorrect ? '✅ Perfect sentence!' : `${feedback.errors?.length || 0} error(s) found`}
                        </div>
                        {feedback.detectedLanguage && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            Detected: {feedback.detectedLanguage}
                          </div>
                        )}
                      </div>
                      {feedback.difficultyLevel && <DifficultyBadge level={feedback.difficultyLevel} />}
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ppFadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </>
  );
}
