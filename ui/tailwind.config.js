/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "serif"],
      },
      colors: {
        editor: {
          bg: "#F7F5F3",
          surface: "#FFFFFF",
          panel: "#FBFAF9",
          border: "#E8E4E0",
          accent: "#37322F",
          "accent-hover": "#49423D",
          text: "#37322F",
          muted: "#8A837E",
          success: "#2D8A56",
          warning: "#C47F17",
        },
      },
      boxShadow: {
        soft: "0 1px 3px rgba(55,50,47,0.06), 0 1px 2px rgba(55,50,47,0.04)",
        medium: "0 4px 12px rgba(55,50,47,0.08)",
        large: "0 12px 40px rgba(55,50,47,0.10)",
      },
    },
  },
  plugins: [],
};
