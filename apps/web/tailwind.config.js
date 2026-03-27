/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          indigo: '#6366f1',
          violet: '#8b5cf6',
        },
        surface: {
          base: '#0a0a0f',
          card: '#111118',
        },
      },
    },
  },
  plugins: [],
}
