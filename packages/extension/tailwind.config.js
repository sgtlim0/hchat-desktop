/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,tsx,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563eb', dark: '#3b82f6' },
        surface: { DEFAULT: '#ffffff', dark: '#1e293b' },
      },
    },
  },
  plugins: [],
}
