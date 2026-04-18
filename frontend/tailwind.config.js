/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'white': '#ffffff',
        'off-white': '#f8f9fc',
        'pearl': '#f0f3f8',
        'frost': '#e6ecf5',
        'silver': '#d0daea',
        'mist': '#b8c8de',
        'slate-blue': '#6b8cba',
        'deep-blue': '#2d5a8e',
        'accent': '#3a7bd5',
        'accent-light': '#e8f0fb',
        'primary-green': '#2ecc8a',
        'green-light': '#e6f9f2',
        'text-dark': '#1a2a3a',
        'text-mid': '#4a5a6a',
        'text-light': '#8a9ab0',
      },
      fontFamily: {
        'serif': ['Cormorant Garamond', 'serif'],
        'sans': ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'lg': '16px',
        'md': '10px',
        'sm': '8px',
      },
      boxShadow: {
        'soft': '0 4px 24px rgba(45, 90, 142, 0.08)',
        'card': '0 8px 40px rgba(45, 90, 142, 0.12)',
        'nav': '0 2px 8px rgba(45, 90, 142, 0.05)',
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.6, transform: 'scale(1.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
