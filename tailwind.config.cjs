/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/renderer/**/*.{ts,tsx}', './src/__test__/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        background: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        placeholder: 'var(--color-placeholder)',
        interactive: {
          hover: 'var(--color-interactive-hover)',
          active: 'var(--color-interactive-active)',
          focus: 'var(--color-interactive-focus)',
        },
        accent: {
          green100: 'var(--color-accent-green-100)',
          green500: 'var(--color-accent-green-500)',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif JP"', 'serif'],
        mono: ['"Roboto Mono"', 'monospace'],
      },
      borderRadius: {
        md: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
}
