/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#0d9488",    // Teal 600 - Great contrast on white
        secondary: "#eab308",  // Yellow 500 - Great for accents
        background: "#0f172a", // Slate 900 - Very dark, high contrast with white text
        surface: "#f8fafc",    // Slate 50 - Very light gray, distinct from pure white
        accent: "#f97316",     // Orange 500
        dark: "#1e293b",       // Slate 800
        "safari-green": "#001a03",
        "safari-gold": "#F1C40F",
      },
      fontFamily: {
        heading: ["'Playfair Display'", "serif"],
        body: ["'Montserrat'", "sans-serif"],
        oswald: ["'Oswald'", "sans-serif"],
        signature: ["'Great Vibes'", "cursive"],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "2rem",
          lg: "4rem",
          xl: "5rem",
          "2xl": "6rem",
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'scroll-infinite': 'scroll 25s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
