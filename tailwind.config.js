/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cinzel', 'Georgia', 'serif'],
      },
      colors: {
        // Accent: warm bronze/gold palette
        accent: {
          50: '#FDF6E8',
          100: '#F9E9C4',
          200: '#F3D28A',
          300: '#EBB84F',
          400: '#E8C77A',
          500: '#C49A4A',
          600: '#A07830',
          700: '#7A5520',
          800: '#5A3A14',
          900: '#3A220A',
        },
        // Surface layers for dark/light
        surface: {
          dark0: '#09090b',
          dark1: '#0e0e12',
          dark2: '#141419',
          dark3: '#1c1c23',
          light0: '#F5F0E6',
          light1: '#EDE6D8',
          light2: '#FFFFFF',
          light3: '#F8F5EF',
        },
        // Custom dark surface palette (legacy, kept for compatibility)
        gray: {
          950: '#09090b',
          900: '#0e0e12',
          800: '#141419',
          750: '#191920',
          700: '#1c1c23',
          600: '#2a2a35',
          500: '#4A4438',
          400: '#8A8070',
          300: '#c4c4d8',
          200: '#d4d4e8',
          100: '#EDE8DC',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
        modal: '0 25px 60px rgba(0,0,0,0.7)',
        glow: '0 0 20px rgba(196,154,74,0.3)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
