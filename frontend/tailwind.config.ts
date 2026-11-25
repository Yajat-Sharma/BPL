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
        cric: {
          red: "#EA2B2B",
          darkRed: "#C62828",
          lightRed: "#FEE2E2",
          bg: "#F5F4EF",
          card: "#FFFFFF",
          surface: "#FDFDFD",
          border: "#E7E5DC",
          dark: "#111827",
          muted: "#6B7280"
        },
        bpl: {
          dark: "#111827",
          forest: "#EA2B2B",
          emerald: "#DC2626",
          mint: "#EA2B2B",
          gold: "#EA2B2B",
          amber: "#F97316",
          charcoal: "#1F2937",
          surface: "#FFFFFF",
          card: "#FFFFFF",
          border: "#E7E5DC"
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
