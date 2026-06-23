/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0C12",
        surface: "#111318",
        card: "#1C1E26",
        borderCustom: "#2C2F3E",
        primary: "#6366F1",
        primaryLight: "#818CF8",
        accent: "#10B981",
        warning: "#F59E0B",
        error: "#F87171",
        streak: "#FF6B35",
        gold: "#FFD700",
        textPrimary: "#F1F5F9",
        textSecondary: "#8B90A7",
        textDisabled: "#4B5070",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      scale: {
        '102': '1.02',
      }
    },
  },
  plugins: [],
}
