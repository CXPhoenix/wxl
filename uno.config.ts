import { defineConfig, presetWind3 } from 'unocss'

export default defineConfig({
  presets: [presetWind3()],

  content: {
    pipeline: {
      include: [/\.(vue|md|ts)($|\?)/],
    },
  },

  theme: {
    colors: {
      'ch-bg':          'var(--ch-bg)',
      'ch-bg-soft':     'var(--ch-bg-soft)',
      'ch-bg-card':     'var(--ch-bg-card)',
      'ch-bg-panel':    'var(--ch-bg-panel)',
      'ch-border':      'var(--ch-border)',
      'ch-border-hover':'var(--ch-border-hover)',
      'ch-accent':      'var(--ch-accent)',
      'ch-accent-soft': 'var(--ch-accent-soft)',
      'ch-text-1':      'var(--ch-text-1)',
      'ch-text-2':      'var(--ch-text-2)',
      'ch-text-3':      'var(--ch-text-3)',
    },
  },

  shortcuts: [
    // Card: block link card with border + hover accent
    ['ch-card', 'relative block rounded-[10px] border border-[var(--ch-border)] bg-[var(--ch-bg-card)] p-[18px] no-underline transition-[border-color,box-shadow] duration-200 overflow-hidden color-[var(--ch-text-1)] hover:border-[var(--ch-border-hover)] hover:shadow-[0_2px_12px_rgba(0,0,0,0.10)]'],

    // Tabs
    ['ch-tab-btn', 'px-3 py-1 text-[0.875em] rounded border border-transparent color-[var(--ch-text-2)] cursor-pointer bg-transparent transition-colors duration-150'],
    ['ch-tab-btn-active', 'border-[var(--ch-accent)] color-[var(--ch-accent)] bg-[var(--ch-accent-soft)]'],

    // Badge base
    ['ch-badge', 'inline-block px-2 py-[2px] rounded-[10px] text-[11px] font-medium'],

    // Difficulty badges
    ['ch-badge-easy',    'ch-badge bg-[var(--ch-easy-bg)] color-[var(--ch-easy-fg)]'],
    ['ch-badge-medium',  'ch-badge bg-[var(--ch-med-bg)]  color-[var(--ch-med-fg)]'],
    ['ch-badge-hard',    'ch-badge bg-[var(--ch-hard-bg)] color-[var(--ch-hard-fg)]'],
    ['ch-badge-mystery', 'ch-badge bg-[var(--ch-myst-bg)] color-[var(--ch-myst-fg)]'],

    // Category badges
    ['ch-badge-web',     'ch-badge bg-[var(--ch-web-bg)]  color-[var(--ch-web-fg)]'],

    // Note cards
    ['ch-note-card', 'block rounded-lg border border-[var(--ch-border)] bg-[var(--ch-bg-card)] p-3 cursor-pointer transition-[border-color] duration-150 hover:border-[var(--ch-border-hover)]'],
    ['ch-note-card-selected', 'border-[var(--ch-accent)]'],
  ],
})
