/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0b0014',
          50: '#0f0a1a',
          100: '#12101f',
          200: '#1a1333',
          300: '#2d1b69',
          400: '#4c1d95',
        },
        end: {
          void: '#0b0014',
          purple: '#a855f7',
          deep: '#1a0033',
          stone: '#d4c175',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delay': 'float 6s ease-in-out 2s infinite',
        'grid-move': 'grid-move 25s linear infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'blink': 'blink 1.2s step-end infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite alternate',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.2)' },
          '50%': { boxShadow: '0 0 50px rgba(168, 85, 247, 0.4), 0 0 80px rgba(168, 85, 247, 0.1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'grid-move': {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(60px, 60px)' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'twinkle': {
          '0%':   { opacity: '0.15', transform: 'scale(0.8)' },
          '50%':  { opacity: '1',    transform: 'scale(1.2)' },
          '100%': { opacity: '0.3',  transform: 'scale(0.9)' },
        },
      },
    },
  },
  plugins: [],
};
