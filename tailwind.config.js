/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/renderer/**/*.{ts,tsx,jsx,js}"],
  theme: {
    extend: {
      colors: {
        surface: "#F8F5F0",
        "surface-muted": "#EEF1F4",
        primary: "#1F6F8B",
        accent: "#F0A35E",
        ink: "#0F1B2C",
        border: "#D7D9DE",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        serif: ["Noto Serif JP", "serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 12px 32px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [],
};
