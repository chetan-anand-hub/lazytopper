export const designTokens = {
  colors: {
    brand600: '#4F46E5',
    brand500: '#6366F1',
    mint500:  '#34D399',
    amber500: '#F59E0B',
    rose500:  '#F43F5E',
    lilac500: '#A78BFA',

    bg:       '#0B1020',
    surface:  '#0F1730',
    surface2: '#121D3A',
    border:   '#223057',
    text:     '#E8EEFF',
    text2:    '#B9C6FF',
    muted:    '#8CA0E8',

    success:  '#22C55E',
    warn:     '#F59E0B',
    danger:   '#EF4444',
    info:     '#60A5FA'
  },
  radius: { sm: 10, md: 14, lg: 18, xl: 22 },
  space:  { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 40, 8: 48 },
  fontSize: { xs:12, sm:14, md:16, lg:18, xl:22, x2l:28 },
  shadow: {
    s1: '0 8px 24px rgba(0,0,0,.35)',
    s2: '0 14px 40px rgba(0,0,0,.45)'
  }
} as const;

export type DesignTokens = typeof designTokens;
