import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          primary: '#4F3FE0',
          'primary-hover': '#4335C9',
          bg: '#F6F7FB',
          card: '#FFFFFF',
          border: '#ECEEF4',
          heading: '#111827',
          body: '#374151',
          muted: '#8A90A2',
          lavender: '#F4F2FF',
          'lavender-light': '#F8F7FF',
          'lavender-border': '#E4DEFF'
        }
      },
      boxShadow: {
        soft: '0 2px 14px rgba(17, 24, 39, 0.04)',
        card: '0 4px 20px rgba(79, 63, 224, 0.06)'
      },
      borderRadius: {
        '2xl': '16px'
      }
    },
  },
  plugins: [],
};

export default config;

