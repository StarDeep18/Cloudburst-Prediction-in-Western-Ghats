/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        storm: {
          50:  '#eef6ff',
          100: '#d9ecff',
          200: '#bcdcff',
          300: '#8ec5ff',
          400: '#59a3fc',
          500: '#347ef8',
          600: '#1d5eed',
          700: '#1649d4',
          800: '#183dab',
          900: '#193887',
          950: '#141f4a',
        },
        rain: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#b9e6fe',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        risk: {
          low:      '#10b981',
          moderate: '#f59e0b',
          high:     '#ef4444',
        },
        dark: {
          900: '#060d1a',
          800: '#0b1628',
          700: '#111e36',
          600: '#172543',
          500: '#1e2f52',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      }
    },
  },
  plugins: [],
}
