import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/**/*.{ts,tsx}"],
  safelist: [
    // Slider gradient colors (from database - dynamically used)
    'bg-gradient-to-r',
    'bg-gradient-to-l',
    'bg-gradient-to-b',
    'bg-gradient-to-t',
    // Purple gradient
    'from-purple-900',
    'via-purple-800',
    'to-pink-900',
    // Green gradient
    'from-green-900',
    'via-green-800',
    'to-teal-900',
    // Blue gradient (default)
    'from-emerald-900',
    'via-emerald-800',
    'to-teal-900',
    // Button colors for sliders
    'text-purple-900',
    'text-green-900',
    'text-emerald-900',
    'bg-white',
    'border-2',
    'border-white',
  ],
  prefix: "",
  theme: {
    fontFamily: {
      sans: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      arabic: ['Amiri', 'Noto Sans Arabic', 'sans-serif'],
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        emerald: {
          50: '#FDFCFB',
          100: '#F3EDE4',
          200: '#EBDDC9',
          300: '#DDCFBA',
          400: '#C4B59B',
          500: '#C4B59B',
          600: '#AC9D7F',
          700: '#948563',
          800: '#7C6D47',
          900: '#64552B',
        },
        green: {
          50: '#FDFCFB',
          100: '#F3EDE4',
          200: '#EBDDC9',
          300: '#DDCFBA',
          400: '#C4B59B',
          500: '#C4B59B',
          600: '#AC9D7F',
          700: '#948563',
          800: '#7C6D47',
          900: '#64552B',
        },
        teal: {
          50: '#FDFCFB',
          100: '#F3EDE4',
          200: '#EBDDC9',
          300: '#DDCFBA',
          400: '#C4B59B',
          500: '#AC9D7F',
          600: '#948563',
          700: '#7C6D47',
          800: '#64552B',
          900: '#4C3D13',
        },
        brand: {
          green: "#C4B59B",
          "green-dark": "#AC9D7F",
          teal: "#948563",
          "teal-light": "#DDCFBA",
          light: "#F3EDE4",
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
