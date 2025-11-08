/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        christmas: {
          red: '#DC2626',
          green: '#059669',
          darkgreen: '#047857',
          white: '#FFFFFF',
          snow: '#F9FAFB',
          gold: '#F59E0B',
        },
      },
    },
  },
  plugins: [],
}

