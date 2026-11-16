import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#F1F5FA", 100: "#E1E9F4", 200: "#C3D2E8", 300: "#98B0D4", 400: "#6A8BBD",
          500: "#4A6DA3", 600: "#38568A", 700: "#2D456F", 800: "#1F3256", 900: "#14233F", 950: "#0B1730",
        },
        gold: { 50: "#FBF5E6", 100: "#F5E8C2", 500: "#B7791F", 600: "#9A6418" },
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,23,48,0.06), 0 1px 3px rgba(11,23,48,0.04)",
        pop: "0 12px 32px rgba(11,23,48,0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
