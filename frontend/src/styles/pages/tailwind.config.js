/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
      },
      colors: {
        'deep-blue':   '#2d5a8e',
        'accent':      '#3a7bd5',
        'accent-light':'#e8f0fb',
        'slate-blue':  '#6b8cba',
        'off-white':   '#f8f9fc',
        'pearl':       '#f0f3f8',
        'frost':       '#e6ecf5',
        'silver':      '#d0daea',
        'mist':        '#b8c8de',
        'text-dark':   '#1a2a3a',
        'text-mid':    '#4a5a6a',
        'text-light':  '#8a9ab0',
        'green':       '#2ecc8a',
        'green-light': '#e6f9f2',
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 4px 24px rgba(45, 90, 142, 0.08)',
        'card': '0 8px 40px rgba(45, 90, 142, 0.12)',
        'modal':'0 20px 60px rgba(45, 90, 142, 0.15)',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'pulse-dot': 'pulse 2s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}