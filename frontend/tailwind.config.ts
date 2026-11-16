import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bpl: {
          dark: "#06130d",
          forest: "#064e3b",
          emerald: "#047857",
          mint: "#10b981",
          gold: "#fbbf24",
          amber: "#f59e0b",
          charcoal: "#0f172a",
          surface: "#112217",
          card: "#0d1f14",
          border: "#1b3827"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      animation: {
        "pulse-fast": "pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slight": "bounce 2s infinite"
      }
    },
  },
  plugins: [],
};
export default config;
