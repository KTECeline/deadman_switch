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
        background: "#08090D",
        "background-alt": "#0F1117",
        card: "#141821",
        "card-alt": "#1B2230",
        foreground: "#FFFFFF",
        secondary: "#A0AEC0",
        muted: "#718096",
        success: "#14F195",
        warning: "#F6C344",
        danger: "#FF5C7A",
        accent: "#9945FF",
        "accent-cyan": "#14F195",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      backgroundImage: {
        "solana-gradient": "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
        "solana-gradient-hover": "linear-gradient(135deg, #A855F7 0%, #22F8A0 100%)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "fade-in": "fade-in 0.6s ease-out",
        "slide-up": "slide-up 0.6s ease-out",
        "countdown-ring": "countdown-ring 1s ease-out",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "countdown-ring": {
          "0%": { strokeDashoffset: "283" },
          "100%": { strokeDashoffset: "0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
