/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        bg: {
          base: '#0a0a0a',
          layer1: '#111111',
          layer2: '#1a1a1a',
          layer3: '#222222',
        },
        surface: '#141414',
        elevated: '#1e1e1e',
        border: '#2a2a2a',
        'border-hover': '#3a3a3a',
        primary: '#7c3aed',
        'primary-hover': '#6d28d9',
        emerald: '#10b981',
        amber: '#f59e0b',
        danger: '#ef4444',
      },
      boxShadow: {
        'glow-primary': '0 0 24px rgba(124, 58, 237, 0.3)',
        'glow-emerald': '0 0 24px rgba(16, 185, 129, 0.3)',
        'glow-amber': '0 0 24px rgba(245, 158, 11, 0.3)',
        'glow-danger': '0 0 24px rgba(239, 68, 68, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'fade-slide-in': 'fadeSlideIn 0.5s ease-out forwards',
        'fade-slide-in-delay-1': 'fadeSlideIn 0.5s ease-out 0.15s forwards',
        'fade-slide-in-delay-2': 'fadeSlideIn 0.5s ease-out 0.3s forwards',
        'fade-slide-in-delay-3': 'fadeSlideIn 0.5s ease-out 0.45s forwards',
        'pulse-ring': 'pulseRing 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'gradient-fill': 'gradientFill 1.5s ease-out forwards',
        'orb-float': 'orbFloat 20s ease-in-out infinite',
        shake: 'shake 0.4s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeSlideIn: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseRing: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0', transform: 'scale(1.15)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradientFill: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        orbFloat: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -20px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      },
    },
  },
  plugins: [],
}
