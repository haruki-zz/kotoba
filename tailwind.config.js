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
        muted: "#5F6C7B",
        success: "#2A8F66",
        danger: "#B42318",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        serif: ["Noto Serif JP", "serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 12px 32px rgba(0, 0, 0, 0.12)",
        soft: "0 8px 24px rgba(15, 27, 44, 0.08)",
        floating: "0 14px 40px rgba(15, 27, 44, 0.12)",
      },
    },
  },
  plugins: [],
};
