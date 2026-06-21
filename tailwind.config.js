/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background:        'hsl(var(--background))',
        foreground:        'hsl(var(--foreground))',
        card:              'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        border:            'hsl(var(--border))',
        input:             'hsl(var(--input))',
        ring:              'hsl(var(--ring))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        teal: {
          DEFAULT:    'hsl(var(--teal))',
          dark:       'hsl(var(--teal-dark))',
          foreground: 'white',
        },
        /* legacy tokens — components reference these directly */
        pink: {
          DEFAULT: '#BF7C93',
          dark:    '#A8697E',
          light:   'rgba(191,124,147,0.18)',
          muted:   'rgba(191,124,147,0.10)',
          border:  'rgba(191,124,147,0.22)',
        },
        charcoal: {
          DEFAULT: '#EDE9F5',
          soft:    'rgba(237,233,245,0.65)',
          muted:   'rgba(237,233,245,0.40)',
          subtle:  'rgba(237,233,245,0.22)',
        },
        surface: {
          DEFAULT: '#1D1826',
          2:       '#13101A',
          3:       '#262130',
        },
        rose: '#CF738A',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm:   'calc(var(--radius) - 4px)',
        md:   'calc(var(--radius) - 2px)',
        lg:   'var(--radius)',
        xl:   '14px',
        '2xl':'18px',
        '3xl':'22px',
      },
      boxShadow: {
        card:       '0 1px 3px rgba(0,0,0,0.40), 0 4px 16px rgba(0,0,0,0.28)',
        'card-lg':  '0 4px 8px rgba(0,0,0,0.45), 0 16px 48px rgba(0,0,0,0.38)',
        pink:       '0 2px 12px rgba(191,124,147,0.30)',
        'pink-lg':  '0 4px 24px rgba(191,124,147,0.38)',
        teal:       '0 2px 12px rgba(77,171,158,0.28)',
        'glass-lg': '0 4px 24px rgba(0,0,0,0.45)',
      },
    },
  },
  plugins: [],
}
