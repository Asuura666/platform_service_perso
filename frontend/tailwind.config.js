import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0d0d0d',
        panel: '#1a1a1a',
        surface: '#151515',
        accent: '#2a67ff',
        accentSoft: '#355eff',
        muted: '#2e2e2e',
        textLight: '#e0e0e0'
      },
      fontFamily: {
        sans: ['"Poppins"', '"Roboto"', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        glow: '0 0 25px rgba(42, 103, 255, 0.35)',
        panel: '0px 18px 40px rgba(10, 20, 45, 0.35)'
      },
      backgroundImage: {
        'gradient-glow': 'radial-gradient(circle at top, rgba(42, 103, 255, 0.45), transparent 60%)'
      },
      borderRadius: {
        xl: '1.5rem'
      }
    }
  },
  plugins: []
}

export default config
