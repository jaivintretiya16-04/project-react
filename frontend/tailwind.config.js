/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        dark: '#06080f',
        card: 'rgba(14, 18, 32, 0.7)',
        'card-hover': 'rgba(20, 26, 46, 0.8)',
        primary: '#00ff88',
        secondary: '#00ccff',
        accent: '#6366f1',
        farmer: '#00e676',
        transporter: '#00ccff',
        retailer: '#ffb300',
        consumer: '#a78bfa',
        muted: '#7a8ba5',
        dim: 'rgba(255,255,255,0.35)',
        danger: '#ff4757',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-in': 'slideIn 0.4s ease forwards',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 24px rgba(0,255,136,0.3)' },
          '50%': { boxShadow: '0 0 36px rgba(0,255,136,0.5)' },
        },
      },
    },
  },
  plugins: [],
}
