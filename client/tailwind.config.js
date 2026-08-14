/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A56DB',
          50: '#EBF5FF',
          100: '#DCE9FF',
          500: '#1A56DB',
          600: '#164CC4',
          700: '#1340A5',
        },
        success: { DEFAULT: '#0E9F6E', light: '#ECFDF5', dark: '#0B7A55' },
        warning: { DEFAULT: '#F59E0B', light: '#FEF3C7', dark: '#B45309' },
        danger: { DEFAULT: '#EF4444', light: '#FEF2F2', dark: '#B91C1C' },
        ink: { DEFAULT: '#111827', 500: '#374151', 600: '#4B5563' },
        gray: { DEFAULT: '#6B7280', light: '#9CA3AF' },
        bglight: '#F9FAFB',
        line: '#E5E7EB',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
        cardhover: '0 8px 24px rgba(0,0,0,0.10)',
        overlay: '0 12px 40px rgba(0,0,0,0.14)',
        focus: '0 0 0 3px rgba(26,86,219,0.15)',
      },
      borderRadius: {
        card: '12px',
        control: '8px',
      },
      keyframes: {
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.55' } },
      },
      animation: {
        slideUp: 'slideUp 0.25s ease-out',
        fadeIn: 'fadeIn 0.2s ease-out',
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
