import type { Config } from 'tailwindcss';

/** Colours come from CSS variables in globals.css so light and dark themes share one set of class names. */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: v('canvas'),
        surface: v('surface'),
        ink: v('ink'),
        muted: v('muted'),
        line: v('line'),
        cobalt: v('cobalt'),
        danger: v('danger'),
        status: {
          todo: v('status-todo'),
          progress: v('status-progress'),
          review: v('status-review'),
          done: v('status-done'),
        },
        priority: {
          low: v('priority-low'),
          medium: v('priority-medium'),
          high: v('priority-high'),
          urgent: v('priority-urgent'),
        },
      },
      fontFamily: { sans: ['var(--font-plex)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};

export default config;
