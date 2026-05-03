export const lightColors = {
  primary: '#E8472A',
  primaryLight: '#FDECEA',
  background: '#F5F4F2',
  surface: '#FAFAF9',
  surfaceAlt: '#E5E0D6',
  text: '#1C1916',
  textSecondary: '#8E867C',
  textMuted: '#BDB5A8',
  border: '#DAD4C6',
  work: '#E8472A',
  rest: '#4CAF50',
  yellow: '#FFF8E1',
  yellowText: '#E8472A',
  // Timer phase backgrounds
  phaseWork: '#FFF5F4',
  phaseRest: '#F1F8E9',
  phaseCountdown: '#EEF2FF',
  phaseDone: '#FFFBEB',
};

export const darkColors = {
  primary: '#FF6B4A',
  primaryLight: '#3D1814',
  background: '#131210',
  surface: '#1D1B18',
  surfaceAlt: '#262320',
  text: '#F5F1E8',
  textSecondary: '#8A8178',
  textMuted: '#484340',
  border: '#2E2B27',
  work: '#FF6B4A',
  rest: '#66BB6A',
  yellow: '#2A1E00',
  yellowText: '#FFB74D',
  // Timer phase backgrounds
  phaseWork: '#1E1614',
  phaseRest: '#141E15',
  phaseCountdown: '#14141F',
  phaseDone: '#1E1900',
};

// Keep for any static/non-themed usage
export const colors = lightColors;

export const getColors = (isDark) => isDark ? darkColors : lightColors;

export const typography = {
  hero: { fontSize: 72, fontWeight: '800', letterSpacing: -2 },
  h1: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' },
  h3: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  caption: { fontSize: 13, fontWeight: '400' },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};
