import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)"
        },
        surface: {
          DEFAULT: "var(--surface)",
          elevated: "var(--surface-elevated)"
        },
        border: {
          subtle: "var(--border-subtle)"
        },
        brand: {
          primary: "var(--brand-primary)",
          hover: "var(--brand-primary-hover)",
          soft: "var(--brand-primary-soft)"
        },
        accent: {
          gold: "var(--accent-gold)",
          "gold-soft": "var(--accent-gold-soft)"
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)"
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        live: "var(--live)"
      },
      borderRadius: {
        card: "var(--radius-card)",
        xl2: "var(--radius-xl)",
        xl3: "var(--radius-2xl)"
      },
      spacing: {
        safe: "var(--safe-bottom)"
      },
      boxShadow: {
        tap: "0 0 0 1px rgba(255,255,255,0.04), 0 12px 30px rgba(0,0,0,0.26)"
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Segoe UI",
          "system-ui",
          "sans-serif"
        ]
      },
      transitionDuration: {
        gentle: "180ms"
      },
      keyframes: {
        pulseLive: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(0.92)", opacity: "0.6" }
        }
      },
      animation: {
        live: "pulseLive 1.8s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
