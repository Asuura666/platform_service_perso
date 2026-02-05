import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0b',
        panel: '#141416',
        surface: '#1a1a1e',
        accent: '#4f7df5',
        accentSoft: '#6b8ff7',
        muted: '#27272a',
        textLight: '#d4d4d8'
      },
      fontFamily: {
        sans: ['"Poppins"', '"Roboto"', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        glow: '0 0 12px rgba(79, 125, 245, 0.12)',
        panel: '0 4px 24px rgba(0, 0, 0, 0.3)'
      },
      backgroundImage: {
        'gradient-glow': 'radial-gradient(circle at top, rgba(79, 125, 245, 0.15), transparent 60%)'
      },
      borderRadius: {
        xl: '1.5rem'
      }
    }
  },
  plugins: []
}

export default config
