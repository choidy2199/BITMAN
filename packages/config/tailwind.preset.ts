import type { Config } from 'tailwindcss';

/**
 * toollab-design-system 기반 Tailwind preset.
 * 색상/폰트는 packages/ui/src/tokens.ts와 동기화된다.
 */
export const tailwindPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#185FA5',
          50: '#E8F1FA',
          100: '#C6DBEF',
          500: '#185FA5',
          600: '#134D85',
          700: '#0E3B66',
        },
        cta: {
          DEFAULT: '#E8593C',
          hover: '#D44A2E',
        },
        section: '#1A1D23',
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
};

export default tailwindPreset;
