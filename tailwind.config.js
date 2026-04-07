/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          0: '#0A0B0F',
          1: '#0E1017',
          2: '#121524',
        },
        panel: {
          1: '#0F1220',
          2: '#11172A',
        },
        stroke: '#232842',
        text: {
          1: '#E7EAF3',
          2: '#A6AEC7',
          3: '#7C86A7',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.45)',
        card: '0 10px 30px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06) inset',
      },
      borderRadius: {
        xl: '18px',
        '2xl': '22px',
      },
      backgroundImage: {
        accent:
          'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(148,163,184,0.9) 100%)',
        glow:
          'radial-gradient(700px circle at var(--x, 25%) var(--y, 15%), rgba(255,255,255,0.10), transparent 45%)',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.98)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '-200% 0%' },
        },
      },
      animation: {
        pop: 'pop 160ms ease-out',
        shimmer: 'shimmer 1.2s linear infinite',
      },
    },
  },
  plugins: [],
}

