/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pink:     { DEFAULT: '#C4286F', dark: '#A82060', light: '#FCE7F3', muted: 'rgba(196,40,111,0.10)', border: 'rgba(196,40,111,0.18)' },
        teal:     { DEFAULT: '#0D9488', dark: '#0F766E', light: '#CCFBF1', muted: 'rgba(13,148,136,0.10)', border: 'rgba(13,148,136,0.18)' },
        charcoal: { DEFAULT: '#0F172A', soft: '#1E293B', muted: '#64748B', subtle: '#94A3B8' },
        surface:  { DEFAULT: '#FFFFFF', 2: '#F8FAFC', 3: '#F1F5F9' },
        border:   { DEFAULT: '#E2E8F0', strong: '#CBD5E1' },
        rose:     '#BE123C',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        xl: '16px', '2xl': '20px', '3xl': '24px',
      },
      boxShadow: {
        card:      '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)',
        'card-lg': '0 4px 8px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.08)',
        pink:      '0 2px 12px rgba(196,40,111,0.28)',
        'pink-lg': '0 4px 24px rgba(196,40,111,0.35)',
        teal:      '0 2px 12px rgba(13,148,136,0.25)',
      },
    },
  },
  plugins: [],
}
