import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep dark theme - AsuraScans inspired
        background: '#09090b',
        panel: '#111113',
        surface: '#18181b',
        
        // Vibrant coral/orange accent
        accent: '#f97316',
        accentSoft: '#fb923c',
        accentMuted: '#fdba74',
        
        // Supporting colors
        muted: '#27272a',
        border: '#3f3f46',
        textLight: '#fafafa',
        textMuted: '#a1a1aa',
        
        // Semantic
        success: '#22c55e',
        warning: '#eab308',
        danger: '#ef4444'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 30px rgba(249, 115, 22, 0.25)',
        'glow-lg': '0 0 50px rgba(249, 115, 22, 0.35)',
        panel: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        card: '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 25px 60px -15px rgba(249, 115, 22, 0.25)'
      },
      backgroundImage: {
        'gradient-glow': 'radial-gradient(ellipse at top, rgba(249, 115, 22, 0.15), transparent 50%)',
        'gradient-radial': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")"
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(249, 115, 22, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(249, 115, 22, 0.4)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)'
      }
    }
  },
  plugins: []
}

export default config
