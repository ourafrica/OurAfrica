/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Apple-inspired modern color palette for LMS
        // Primary SF Colors with enhanced dark mode variants
        "sf-blue": {
          DEFAULT: "#007AFF",
          50: "#E6F3FF",
          100: "#CCE7FF",
          200: "#99CFFF",
          300: "#66B7FF",
          400: "#339FFF",
          500: "#007AFF",
          600: "#0056CC",
          700: "#004199",
          800: "#002D66",
          900: "#001833",
          dark: "#0A84FF", // Brighter for dark mode
        },
        "sf-purple": {
          DEFAULT: "#AF52DE",
          50: "#F4E6FF",
          100: "#E9CCFF",
          200: "#D399FF",
          300: "#BD66FF",
          400: "#A733FF",
          500: "#AF52DE",
          600: "#8C42B8",
          700: "#693192",
          800: "#46216C",
          900: "#231046",
          dark: "#BF5AF2", // Lighter for dark mode
        },
        "sf-green": {
          DEFAULT: "#34C759",
          50: "#E8F9EC",
          100: "#D1F2D9",
          200: "#A3E5B3",
          300: "#75D88D",
          400: "#47CB67",
          500: "#34C759",
          600: "#2A9F47",
          700: "#1F7735",
          800: "#154F23",
          900: "#0A2712",
          dark: "#30D158", // Brighter for dark mode
        },
        "sf-orange": {
          DEFAULT: "#FF9500",
          50: "#FFF4E6",
          100: "#FFE9CC",
          200: "#FFD399",
          300: "#FFBD66",
          400: "#FFA733",
          500: "#FF9500",
          600: "#CC7700",
          700: "#995900",
          800: "#663B00",
          900: "#331D00",
          dark: "#FF9F0A", // Warmer for dark mode
        },
        "sf-red": {
          DEFAULT: "#FF3B30",
          50: "#FFE9E7",
          100: "#FFD3CF",
          200: "#FFA79F",
          300: "#FF7B6F",
          400: "#FF4F3F",
          500: "#FF3B30",
          600: "#CC2F26",
          700: "#99231D",
          800: "#661713",
          900: "#330C0A",
          dark: "#FF453A", // Softer for dark mode
        },
        "sf-pink": {
          DEFAULT: "#FF2D92",
          50: "#FFE6F4",
          100: "#FFCCE9",
          200: "#FF99D3",
          300: "#FF66BD",
          400: "#FF33A7",
          500: "#FF2D92",
          600: "#CC2475",
          700: "#991B58",
          800: "#66123A",
          900: "#33091D",
          dark: "#FF375F", // Adjusted for dark mode
        },

        // Enhanced System Grays with proper dark theme hierarchy
        "system-gray-6": {
          DEFAULT: "#F2F2F7",
          dark: "#1C1C1E",
        },
        "system-gray-5": {
          DEFAULT: "#E5E5EA",
          dark: "#2C2C2E",
        },
        "system-gray-4": {
          DEFAULT: "#D1D1D6",
          dark: "#3A3A3C",
        },
        "system-gray-3": {
          DEFAULT: "#C7C7CC",
          dark: "#48484A",
        },
        "system-gray-2": {
          DEFAULT: "#AEAEB2",
          dark: "#636366",
        },
        "system-gray": {
          DEFAULT: "#8E8E93",
          dark: "#8E8E93",
        },

        // Enhanced Label Colors with proper opacity for dark theme
        label: {
          DEFAULT: "#000000",
          dark: "#FFFFFF",
        },
        "secondary-label": {
          DEFAULT: "#3C3C43",
          dark: "#EBEBF5",
        },
        "tertiary-label": {
          DEFAULT: "#3C3C4399",
          dark: "#EBEBF560",
        },
        "quaternary-label": {
          DEFAULT: "#3C3C4330",
          dark: "#EBEBF530",
        },

        // Dark theme surface elevation system
        "dark-surface": {
          0: "#000000", // True black base
          1: "#1C1C1E", // Cards, modals
          2: "#2C2C2E", // Elevated cards, dropdowns
          3: "#3A3A3C", // Tooltips, popovers
        },

        // Dark theme border system
        "dark-border": {
          primary: "#38383A",
          secondary: "#48484A",
          tertiary: "#545458",
        },

        // Map to standard Tailwind naming for compatibility
        primary: {
          DEFAULT: "#007AFF",
          50: "#E6F3FF",
          100: "#CCE7FF",
          200: "#99CFFF",
          300: "#66B7FF",
          400: "#339FFF",
          500: "#007AFF",
          600: "#0056CC",
          700: "#004199",
          800: "#002D66",
          900: "#001833",
        },
        secondary: {
          DEFAULT: "#AF52DE",
          50: "#F4E6FF",
          100: "#E9CCFF",
          200: "#D399FF",
          300: "#BD66FF",
          400: "#A733FF",
          500: "#AF52DE",
          600: "#8C42B8",
          700: "#693192",
          800: "#46216C",
          900: "#231046",
        },
        accent: {
          DEFAULT: "#FF9500",
          50: "#FFF4E6",
          100: "#FFE9CC",
          200: "#FFD399",
          300: "#FFBD66",
          400: "#FFA733",
          500: "#FF9500",
          600: "#CC7700",
          700: "#995900",
          800: "#663B00",
          900: "#331D00",
        },

        // Enhanced semantic colors with dark mode variants
        success: {
          DEFAULT: "#34C759",
          50: "#E8F9EC",
          100: "#D1F2D9",
          200: "#A3E5B3",
          300: "#75D88D",
          400: "#47CB67",
          500: "#34C759",
          600: "#2A9F47",
          700: "#1F7735",
          800: "#154F23",
          900: "#0A2712",
        },
        warning: {
          DEFAULT: "#FF9500",
          50: "#FFF4E6",
          100: "#FFE9CC",
          200: "#FFD399",
          300: "#FFBD66",
          400: "#FFA733",
          500: "#FF9500",
          600: "#CC7700",
          700: "#995900",
          800: "#663B00",
          900: "#331D00",
        },
        error: {
          DEFAULT: "#FF3B30",
          50: "#FFE9E7",
          100: "#FFD3CF",
          200: "#FFA79F",
          300: "#FF7B6F",
          400: "#FF4F3F",
          500: "#FF3B30",
          600: "#CC2F26",
          700: "#99231D",
          800: "#661713",
          900: "#330C0A",
        },

        // Enhanced background system with proper dark theme support
        background: {
          DEFAULT: "#FFFFFF",
          secondary: "#F2F2F7",
          tertiary: "#E5E5EA",
          dark: "#000000",
          "dark-secondary": "#1C1C1E",
          "dark-tertiary": "#2C2C2E",
          "dark-quaternary": "#3A3A3C",
        },

        // Updated gray scale with better dark theme progression
        gray: {
          DEFAULT: "#8E8E93",
          50: "#F2F2F7",
          100: "#E5E5EA",
          200: "#D1D1D6",
          300: "#C7C7CC",
          400: "#AEAEB2",
          500: "#8E8E93",
          600: "#636366",
          700: "#48484A",
          800: "#3A3A3C",
          900: "#2C2C2E",
          950: "#1C1C1E",
        },

        // Enhanced black/white with proper dark theme variants
        black: {
          DEFAULT: "#000000",
          100: "#1C1C1E",
          200: "#2C2C2E",
          300: "#3A3A3C",
          400: "#48484A",
          500: "#636366",
          600: "#8E8E93",
          700: "#AEAEB2",
          800: "#C7C7CC",
          900: "#D1D1D6",
        },
        white: {
          DEFAULT: "#FFFFFF",
          100: "#F2F2F7",
          200: "#E5E5EA",
          300: "#D1D1D6",
          400: "#C7C7CC",
          500: "#AEAEB2",
          600: "#8E8E93",
          700: "#636366",
          800: "#48484A",
          900: "#3A3A3C",
        },
      },
      spacing: {
        18: "4.5rem",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        progress: {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-out",
        slideUp: "slideUp 0.5s ease-out",
        progress: "progress 1s ease-out",
      },
    },
  },
  plugins: [],
};
