import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#111113',
        panel: '#1a1a1e',
        surface: '#222226',
        accent: '#f97316',
        accentSoft: '#fb923c',
        accentAmber: '#fbbf24',
        muted: '#2a2a2e',
        textLight: '#e4e4e7',
        textMuted: '#71717a'
      },
      fontFamily: {
        sans: ['"DM Sans"', '"Poppins"', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        card: '0 2px 16px rgba(0, 0, 0, 0.4)',
        panel: '0 4px 24px rgba(0, 0, 0, 0.35)',
        hero: '0 8px 40px rgba(0, 0, 0, 0.6)'
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(to top, #111113 0%, transparent 60%)',
        'gradient-card': 'linear-gradient(to top, rgba(17,17,19,0.95) 0%, transparent 100%)'
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1rem',
        '3xl': '1.25rem'
      }
    }
  },
  plugins: []
}

export default config
