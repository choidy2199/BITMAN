import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#DA291C",
          dark: "#A8211A",
        },
      },
    },
  },
  plugins: [],
};

export default config;
