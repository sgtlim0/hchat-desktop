/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          light: 'var(--primary-light)',
        },
        page: 'var(--bg-page)',
        sidebar: 'var(--bg-sidebar)',
        card: 'var(--bg-card)',
        input: 'var(--bg-input)',
        hover: 'var(--bg-hover)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        border: 'var(--border)',
        'border-input': 'var(--border-input)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
        amber: 'var(--amber)',
        'yellow-star': 'var(--yellow-star)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      width: {
        sidebar: '264px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
