/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FAF8F3",
        ink: "#211E1A",
        muted: "#8A847A",
        "muted-2": "#A39A8C",
        line: "#E7E3DB",
        surface: "#ECE7DE",
        accent: "#C2693E",
        success: "#3F8E5B",
      },
      fontFamily: {
        sans: ["Hanken Grotesk", "system-ui", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "serif"],
      },
      borderRadius: {
        field: "14px",
        card: "16px",
        logo: "18px",
      },
    },
  },
  plugins: [],
};
