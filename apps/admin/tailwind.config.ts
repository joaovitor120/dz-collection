import type { Config } from 'tailwindcss';

/**
 * DESIGN SYSTEM — DZ COLLECTION
 * Base clara e quente, preto sofisticado para texto e navegação,
 * dourado exclusivamente como accent (detalhes, hover, tags, seleção).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    // Breakpoints — mobile first, cobrindo os alvos do briefing
    screens: {
      xs: '390px',
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1440px',
    },
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', md: '2rem', xl: '2.5rem' },
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        ink: {
          DEFAULT: '#131211', // off-black quente — textos e navegação
          soft: '#3A3735',
          muted: '#6E6A65', // texto secundário
        },
        paper: {
          DEFAULT: '#FAF8F4', // warm white — base do site
          pure: '#FFFFFF',
          shade: '#F1EDE6', // neutro claro para superfícies
        },
        line: {
          DEFAULT: '#E4DED3', // linhas finas (editorial, sem sombras)
          strong: '#CFC6B7',
        },
        gold: {
          DEFAULT: '#B08D47', // accent premium
          soft: '#C7A96B',
          deep: '#8C6E33',
        },
        whats: '#25D366', // usado apenas no ícone / micro-detalhe
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
      },
      letterSpacing: {
        widest2: '0.22em',
      },
      borderRadius: {
        // Editorial: cantos praticamente retos
        none: '0px',
        xs: '2px',
        sm: '3px',
        DEFAULT: '4px',
        md: '6px',
        full: '9999px',
      },
      boxShadow: {
        // Sombras discretas — a hierarquia vem de linha, contraste e espaço
        subtle: '0 1px 2px rgba(19,18,17,0.05)',
        lift: '0 8px 28px -18px rgba(19,18,17,0.35)',
        drawer: '-12px 0 40px -24px rgba(19,18,17,0.45)',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      transitionDuration: {
        250: '250ms',
        400: '400ms',
      },
      zIndex: {
        header: '40',
        overlay: '50',
        drawer: '60',
        float: '30',
      },
      maxWidth: {
        prose2: '62ch',
      },
      aspectRatio: {
        portrait: '3 / 4',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 480ms cubic-bezier(0.22,0.61,0.36,1) both',
        fadeIn: 'fadeIn 300ms ease-out both',
        slideInRight: 'slideInRight 280ms cubic-bezier(0.22,0.61,0.36,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
