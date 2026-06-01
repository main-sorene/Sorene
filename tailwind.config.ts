import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";
import animate from "tailwindcss-animate";

export default {
  darkMode: "class",
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        errormain: "var(--errormain)",
        infomain: "var(--infomain)",
        "neutral-10": "var(--neutral-10)",
        "neutral-20": "var(--neutral-20)",
        "neutral-30": "var(--neutral-30)",
        "neutral-60": "var(--neutral-60)",
        primarybackground: "var(--primarybackground)",
        primaryborder: "var(--primaryborder)",
        primaryhover: "var(--primaryhover)",
        primarymain: "var(--primarymain)",
        "primaryouter-border": "var(--primaryouter-border)",
        primarypressed: "var(--primarypressed)",
        primarysurface: "var(--primarysurface)",
        successhover: "var(--successhover)",
        successmain: "var(--successmain)",
        warningfocus: "var(--warningfocus)",
        warningmain: "var(--warningmain)",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        satoshi: ["Satoshi", "sans-serif"],
        "inter-tight": ["Inter Tight", "sans-serif"],
        sans: [
          "Inter Tight",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
      },
      fontSize: {
        "display-large": ["72px", { lineHeight: "80px", letterSpacing: "-2%", fontWeight: "500" }],
        "display-medium": ["64px", { lineHeight: "72px", letterSpacing: "-2%", fontWeight: "500" }],
        "display-small": ["56px", { lineHeight: "64px", letterSpacing: "-2%", fontWeight: "500" }],
        "heading-large": ["48px", { lineHeight: "56px", letterSpacing: "-2%", fontWeight: "500" }],
        "heading-medium": ["40px", { lineHeight: "48px", letterSpacing: "-2%", fontWeight: "500" }],
        "heading-small": ["32px", { lineHeight: "40px", letterSpacing: "-2%", fontWeight: "500" }],
        "heading-xsmall": ["24px", { lineHeight: "32px", letterSpacing: "-1.5%", fontWeight: "500" }],
        "body-large-medium": ["18px", { lineHeight: "26px", letterSpacing: "0.5px", fontWeight: "500" }],
        "body-large": ["18px", { lineHeight: "26px", letterSpacing: "0.5px", fontWeight: "400" }],
        "body-medium-medium": ["16px", { lineHeight: "24px", letterSpacing: "0.5px", fontWeight: "500" }],
        "body-medium": ["16px", { lineHeight: "24px", letterSpacing: "0.5px", fontWeight: "400" }],
        "body-small-medium": ["14px", { lineHeight: "20px", letterSpacing: "0.5px", fontWeight: "500" }],
        "body-small": ["14px", { lineHeight: "20px", letterSpacing: "0.5px", fontWeight: "400" }],
        "body-xsmall-medium": ["12px", { lineHeight: "16px", letterSpacing: "0.5px", fontWeight: "500" }],
        "body-xsmall": ["12px", { lineHeight: "16px", letterSpacing: "0.5px", fontWeight: "400" }],
        "label-large": ["16px", { lineHeight: "24px", letterSpacing: "-1%", fontWeight: "400" }],
        "label-medium": ["14px", { lineHeight: "20px", letterSpacing: "-1%", fontWeight: "400" }],
        "label-small": ["12px", { lineHeight: "16px", letterSpacing: "-1%", fontWeight: "400" }],
        "caption-medium": ["10px", { lineHeight: "12px", letterSpacing: "0px", fontWeight: "500" }],
        "caption-small": ["9px", { lineHeight: "10px", letterSpacing: "0px", fontWeight: "500" }],
      },
      boxShadow: {
        shadow: "var(--shadow)",
        "shadow-xs": "var(--shadow-xs)",
        "yellow-shadow": "var(--yellow-shadow)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
  },
  plugins: [animate, typography],
} satisfies Config;
