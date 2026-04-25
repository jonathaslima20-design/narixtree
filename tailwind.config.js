/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        surface: {
          0: '#0B0E11',
          1: '#11151A',
          2: '#161B22',
          3: '#1C2230',
        },
        ink: {
          primary: '#FFFFFF',
          secondary: 'rgba(255,255,255,0.72)',
          muted: 'rgba(255,255,255,0.55)',
          faint: 'rgba(255,255,255,0.40)',
        },
      },
      boxShadow: {
        glow: '0 10px 40px -10px rgba(255,255,255,0.18)',
        'glow-lg': '0 20px 80px -20px rgba(255,255,255,0.24)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
