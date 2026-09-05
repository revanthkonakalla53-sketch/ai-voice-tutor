import './globals.css';

export const metadata = {
  title: 'LanguageAI — AI Voice Language Tutor',
  description:
    'Speak a sentence in any language. LanguageAI transcribes it, checks your grammar with Gemini AI, and reads back a corrected version.',
  keywords: ['language tutor', 'AI', 'speech recognition', 'grammar correction', 'Gemini', 'text to speech'],
  openGraph: {
    title: 'LanguageAI — AI Voice Language Tutor',
    description: 'Speak. Get corrected. Improve. Powered by Google Gemini.',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
