import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        highlight: "highlight 1s ease-in-out",
        "move-to-top": "moveToTop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
        selection: "selection 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        highlight: {
          "0%": {
            transform: "translateY(0)",
            backgroundColor: "hsl(var(--primary) / 0.3)",
            boxShadow: "0 0 15px 5px hsl(var(--primary) / 0.2)",
          },
          "50%": {
            transform: "translateY(-5px)",
            backgroundColor: "hsl(var(--primary) / 0.4)",
            boxShadow: "0 0 20px 8px hsl(var(--primary) / 0.3)",
          },
          "100%": {
            transform: "translateY(0)",
            backgroundColor: "hsl(var(--primary) / 0.1)",
            boxShadow: "0 0 0 0 transparent",
          },
        },
        moveToTop: {
          "0%": {
            transform: "translateY(0)",
            opacity: "1",
          },
          "15%": {
            transform: "translateY(5px)",
            opacity: "0.9",
          },
          "30%": {
            transform: "translateY(-30px)",
            opacity: "0.7",
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        selection: {
          "0%": {
            transform: "scale(1)",
          },
          "50%": {
            transform: "scale(1.05)",
          },
          "100%": {
            transform: "scale(1)",
          },
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
