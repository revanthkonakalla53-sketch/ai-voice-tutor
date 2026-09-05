'use client';

const ERROR_TYPE_ICONS = {
  grammar: '📝',
  vocabulary: '📚',
  spelling: '🔤',
  punctuation: '·',
  fluency: '💬',
};

function ScoreCircle({ score }) {
  const cls = score >= 8 ? 'high' : score >= 5 ? 'mid' : 'low';
  return (
    <div className={`score-circle ${cls}`} title={`Score: ${score}/10`}>
      {score}
      <span style={{ fontSize: '0.55rem', position: 'absolute', bottom: 4, fontWeight: 400 }}>/10</span>
    </div>
  );
}

function SkeletonFeedback() {
  return (
    <div className="glass-card feedback-card">
      <div className="feedback-header">
        <div className="skeleton skeleton-line" style={{ width: 140, height: 18 }} />
        <div className="skeleton" style={{ width: 52, height: 52, borderRadius: '50%' }} />
      </div>
      <div className="skeleton skeleton-line" style={{ width: '100%', height: 60, borderRadius: 12, marginBottom: 16 }} />
      <div className="skeleton skeleton-line" style={{ width: '100%', height: 70, borderRadius: 8, marginBottom: 8 }} />
      <div className="skeleton skeleton-line" style={{ width: '80%', height: 70, borderRadius: 8 }} />
    </div>
  );
}

export default function FeedbackCard({ feedback, loading }) {
  if (loading) return <SkeletonFeedback />;
  if (!feedback) return null;

  const { correctedSentence, score, isCorrect, errors, tip, nativePhrase, detectedLanguage } = feedback;

  return (
    <div className="glass-card feedback-card">
      {/* Header */}
      <div className="feedback-header">
        <div className="feedback-title">
          <span>{isCorrect ? '✅' : '🎯'}</span>
          <span>{isCorrect ? 'Perfect Sentence!' : 'Maya\'s Feedback'}</span>
          {detectedLanguage && (
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              padding: '2px 10px',
              borderRadius: '999px',
              background: 'rgba(139,92,246,0.15)',
              color: 'var(--purple-400, #a78bfa)',
              border: '1px solid rgba(139,92,246,0.3)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              {detectedLanguage}
            </span>
          )}
        </div>
        <div className="score-badge">
          <div>
            <div className="score-label" style={{ textAlign: 'right' }}>Score</div>
          </div>
          <ScoreCircle score={score} />
        </div>
      </div>

      {/* Corrected Sentence */}
      {!isCorrect && correctedSentence && (
        <div className="corrected-box">
          <div className="corrected-label">✏️ Corrected Version</div>
          <div className="corrected-text">"{correctedSentence}"</div>
        </div>
      )}

      {/* Native phrase (if different) */}
      {nativePhrase && nativePhrase !== correctedSentence && (
        <div className="corrected-box" style={{ background: 'rgba(6,182,212,0.06)', borderColor: 'rgba(6,182,212,0.25)', marginBottom: 16 }}>
          <div className="corrected-label" style={{ color: 'var(--cyan-500)' }}>🗣️ How a Native Speaker Might Say It</div>
          <div className="corrected-text">"{nativePhrase}"</div>
        </div>
      )}

      {/* Errors */}
      {errors && errors.length > 0 && (
        <div className="errors-list">
          {errors.map((err, i) => (
            <div
              key={i}
              className={`error-item ${err.type === 'vocabulary' || err.type === 'fluency' ? 'improvement' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: '0.75rem' }}>
                  {ERROR_TYPE_ICONS[err.type] || '🔹'}
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                  {err.type}
                </span>
              </div>
              {err.original && (
                <div className="error-original">"{err.original}"</div>
              )}
              {err.corrected && (
                <div className="error-fix">→ "{err.corrected}"</div>
              )}
              <div className="error-explanation">{err.explanation}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tip */}
      {tip && (
        <div className="tip-box">
          <span className="tip-icon">💡</span>
          <span>{tip}</span>
        </div>
      )}
    </div>
  );
}
