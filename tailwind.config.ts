import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B1E1E',
          50: '#FDF2F2',
          100: '#FAE0E0',
          200: '#F4BDBD',
          300: '#EC8A8A',
          400: '#E05555',
          500: '#D12B2B',
          600: '#B01E1E',
          700: '#8B1E1E',
          800: '#6E1818',
          900: '#5A1515',
        },
        secondary: {
          DEFAULT: '#D9A441',
          50: '#FDF8EC',
          100: '#FAEDD0',
          200: '#F5D89B',
          300: '#EFC36A',
          400: '#E9B04B',
          500: '#D9A441',
          600: '#C08930',
          700: '#9E6E27',
          800: '#7D5621',
          900: '#664520',
        },
        accent: {
          DEFAULT: '#E67E22',
          50: '#FEF2E7',
          100: '#FDE1C5',
          200: '#FBBB80',
          300: '#F99A48',
          400: '#F08224',
          500: '#E67E22',
          600: '#C96015',
          700: '#A64913',
          800: '#883B13',
          900: '#6F3112',
        },
        cream: '#FFF8F0',
        brown: {
          DEFAULT: '#3A2A20',
          light: '#6B4F3A',
          dark: '#1E1410',
        },
        success: '#2E7D32',
        warning: '#F9A825',
        error: '#C62828',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        input: '12px',
        badge: '8px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(58,42,32,0.08)',
        'card-hover': '0 4px 24px rgba(58,42,32,0.14)',
        'card-lg': '0 8px 32px rgba(58,42,32,0.12)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #8B1E1E 0%, #D9A441 100%)',
        'gradient-cream': 'linear-gradient(180deg, #FFF8F0 0%, #FDF0E0 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
