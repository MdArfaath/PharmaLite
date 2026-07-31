import type { Config } from "tailwindcss";

/**
 * Design tokens (see PROJECT.md §21 UI Guidelines).
 * - One brand accent: a calm clinical teal (trust, medical, not "enterprise blue").
 * - Neutral slate greys for surfaces/text.
 * - Semantic colors match the schema's alert states:
 *     amber = low stock, red = expiry/expired, green = success.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#effcf6",
          100: "#d3f5e5",
          200: "#aaead0",
          300: "#72d9b4",
          400: "#3cc194",
          500: "#17a67a", // primary accent
          600: "#0c8563",
          700: "#0b6a51",
          800: "#0c5442",
          900: "#0b4638",
          950: "#04271f",
        },
        // Semantic aliases (used via classes like text-warn, bg-danger/10, etc.)
        warn: "#d97706", // amber-600 — low stock
        danger: "#dc2626", // red-600 — expired / destructive
        success: "#16a34a", // green-600 — sold/saved
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      spacing: {
        // Safe-area helpers for phones with notches / gesture bars.
        "safe-b": "env(safe-area-inset-bottom)",
        "safe-t": "env(safe-area-inset-top)",
      },
      minHeight: {
        touch: "44px", // minimum touch target (PROJECT.md)
      },
      minWidth: {
        touch: "44px",
      },
    },
  },
  plugins: [],
};

export default config;
