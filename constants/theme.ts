// Powered by OnSpace.AI
export const Colors = {
  // Brand
  primary: '#2D7D46',
  primaryLight: '#E8F5ED',
  primaryDark: '#1E5C32',

  // Background
  background: '#F5F8F6',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0F4F1',

  // Status
  expired: '#DC2626',
  expiredBg: '#FEF2F2',
  expiredBorder: '#FECACA',

  soon: '#D97706',
  soonBg: '#FFFBEB',
  soonBorder: '#FDE68A',

  fresh: '#059669',
  freshBg: '#ECFDF5',
  freshBorder: '#A7F3D0',

  // Text
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // UI
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  shadow: '#000000',

  // Categories
  category1: '#EFF6FF',
  category2: '#FFF7ED',
  category3: '#F5F3FF',
  category4: '#FFF1F2',
};

export const Fonts = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Shadow = {
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
