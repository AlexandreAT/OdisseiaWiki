export type ColorScheme = 'blue' | 'purple' | 'cyan' | 'green' | 'orange';

const colorVars: Record<ColorScheme, { color: string; clearColor: string }> = {
  blue: { color: 'var(--neonBlue)', clearColor: 'var(--clearneonBlue)' },
  purple: { color: 'var(--neonPurple)', clearColor: 'var(--clearneonPurple)' },
  cyan: { color: 'var(--neonCyan)', clearColor: 'var(--clearneonCyan)' },
  green: { color: 'var(--neonGreen)', clearColor: 'var(--clearneonGreen)' },
  orange: { color: 'var(--neonOrange)', clearColor: 'var(--clearneonOrange)' },
};

export const getColorVars = (scheme: ColorScheme) => colorVars[scheme];
