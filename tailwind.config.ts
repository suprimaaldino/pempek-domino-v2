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
        // Brand red — cleaner, more vibrant
        primary: {
          DEFAULT: '#D42B2B',
          50:  '#FEF2F2',
          100: '#FDDEDE',
          200: '#FBB8B8',
          300: '#F88080',
          400: '#F45050',
          500: '#D42B2B',
          600: '#B82222',
          700: '#971A1A',
          800: '#771414',
          900: '#5C1010',
        },
        // Neutral scale — replaces all brown/cream usage
        neutral: {
          0:   '#FFFFFF',
          50:  '#F7F7F7',
          100: '#EFEFEF',
          200: '#E0E0E0',
          300: '#C8C8C8',
          400: '#A0A0A0',
          500: '#737373',
          600: '#555555',
          700: '#3A3A3A',
          800: '#222222',
          900: '#111111',
        },
        // Keep semantic aliases for backwards compat
        cream:   '#F7F7F7',
        brown: {
          DEFAULT: '#111111',
          light:   '#555555',
          dark:    '#000000',
        },
        secondary: {
          DEFAULT: '#D42B2B',
          50: '#FEF2F2',
          100: '#FDDEDE',
          600: '#B82222',
          700: '#971A1A',
        },
        // Status colors
        success: '#16A34A',
        warning: '#D97706',
        error:   '#DC2626',
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        sans:    ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card:  '16px',
        input: '10px',
        badge: '8px',
        pill:  '999px',
      },
      boxShadow: {
        card:       '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.10)',
        'card-lg':  '0 8px 24px rgba(0,0,0,0.10)',
        sm:         '0 1px 2px rgba(0,0,0,0.06)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #D42B2B 0%, #971A1A 100%)',
        'gradient-surface': 'linear-gradient(180deg, #FFFFFF 0%, #F7F7F7 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
