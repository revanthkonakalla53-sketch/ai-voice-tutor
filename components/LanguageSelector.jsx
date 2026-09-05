'use client';

const LANGUAGES = [
  { code: 'auto',  label: 'Auto-detect', flag: '🌐' },
  { code: 'en-US', label: 'English',     flag: '🇺🇸' },
  { code: 'te-IN', label: 'Telugu',      flag: '🇮🇳' },
  { code: 'hi-IN', label: 'Hindi',       flag: '🇮🇳' },
  { code: 'es-ES', label: 'Spanish',     flag: '🇪🇸' },
  { code: 'fr-FR', label: 'French',      flag: '🇫🇷' },
  { code: 'de-DE', label: 'German',      flag: '🇩🇪' },
  { code: 'ja-JP', label: 'Japanese',    flag: '🇯🇵' },
  { code: 'pt-BR', label: 'Portuguese',  flag: '🇧🇷' },
  { code: 'it-IT', label: 'Italian',     flag: '🇮🇹' },
  { code: 'zh-CN', label: 'Chinese',     flag: '🇨🇳' },
  { code: 'ko-KR', label: 'Korean',      flag: '🇰🇷' },
  { code: 'ru-RU', label: 'Russian',     flag: '🇷🇺' },
  { code: 'ar-SA', label: 'Arabic',      flag: '🇸🇦' },
];

export default function LanguageSelector({ selected, onSelect, disabled }) {
  return (
    <div className="glass-card" style={{ padding: '20px 24px' }}>
      <div className="lang-grid">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            id={`lang-${lang.code}`}
            className={`lang-chip ${selected?.code === lang.code ? 'active' : ''}`}
            onClick={() => onSelect(lang)}
            disabled={disabled}
            aria-pressed={selected?.code === lang.code}
            title={lang.label}
          >
            <span className="flag">{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
