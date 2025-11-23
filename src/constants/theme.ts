/**
 * CallWall Theme Configuration
 * Army Green, Red, and White color scheme for clear, authoritative interface
 */

export const Colors = {
  // Primary Colors
  primary: '#4B5320',        // Army Green - Primary background
  primaryDark: '#3A4218',    // Darker Army Green
  primaryLight: '#5C6428',   // Lighter Army Green

  // Accent Colors
  accent: '#FF0000',         // Red - Primary text and accents
  accentDark: '#CC0000',     // Darker Red
  accentLight: '#FF3333',    // Lighter Red

  // Neutral Colors
  white: '#FFFFFF',          // White - Highlights and clean elements
  offWhite: '#F8F8F8',       // Off-white for softer backgrounds
  lightGray: '#E0E0E0',      // Light gray for borders
  mediumGray: '#888888',     // Medium gray for secondary text
  darkGray: '#333333',       // Dark gray for input text

  // Status Colors
  success: '#00AA00',        // Green for success states
  warning: '#FF8800',        // Orange for warnings
  error: '#FF0000',          // Red for errors (matches accent)
  info: '#007ACC',           // Blue for information

  // Background Colors
  background: '#4B5320',     // Main app background
  surface: '#5C6428',        // Card/surface backgrounds
  input: '#6B7328',          // Input field backgrounds
  modal: '#3A4218',          // Modal backgrounds

  // Text Colors
  textPrimary: '#FFFFFF',    // Primary text (white)
  textSecondary: '#FF0000',  // Secondary text (red)
  textAccent: '#FFFFFF',     // Accent text (white)
  textMuted: '#CCCCCC',      // Muted text
  textInput: '#333333',      // Input text (dark for readability)

  // Border Colors
  border: '#7B8328',         // Standard borders
  borderLight: '#8B9338',    // Light borders
  borderDark: '#3B4218',     // Dark borders

  // Button Colors
  buttonPrimary: '#FF0000',  // Primary button (red)
  buttonSecondary: '#FFFFFF', // Secondary button (white)
  buttonDisabled: '#888888', // Disabled button

  // Gradient Colors
  gradientStart: '#4B5320',  // Gradient start (army green)
  gradientEnd: '#3A4218',    // Gradient end (darker army green)

  // Shadow Colors
  shadow: '#000000',         // Shadow color
  shadowLight: '#1A1A1A',    // Light shadow
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
};

export const Typography = {
  // Font Sizes
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  heading: 24,
  title: 28,
  display: 32,

  // Font Weights
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',

  // Font Families
  primary: 'System',
  secondary: 'System',
  mono: 'Monospace',
};

export const Shadows = {
  small: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const CommonStyles = {
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Card Styles
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.medium,
  },

  // Button Styles
  buttonPrimary: {
    backgroundColor: Colors.buttonPrimary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },

  buttonSecondary: {
    backgroundColor: Colors.buttonSecondary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  buttonDisabled: {
    backgroundColor: Colors.buttonDisabled,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Input Styles
  input: {
    backgroundColor: Colors.input,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textInput,
    fontSize: Typography.base,
  },

  inputFocused: {
    borderColor: Colors.accent,
    borderWidth: 2,
  },

  inputError: {
    borderColor: Colors.error,
    borderWidth: 2,
  },

  // Text Styles
  textPrimary: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontWeight: Typography.normal,
  },

  textSecondary: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontWeight: Typography.normal,
  },

  textAccent: {
    color: Colors.textAccent,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },

  textHeading: {
    color: Colors.textPrimary,
    fontSize: Typography.heading,
    fontWeight: Typography.bold,
  },

  textTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.title,
    fontWeight: Typography.extrabold,
  },

  // Header Styles
  header: {
    backgroundColor: Colors.primaryDark,
    paddingTop: 60,
    paddingBottom: Spacing.md,
  },

  headerContent: {
    paddingHorizontal: Spacing.md,
  },

  // Surface Styles
  surface: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.medium,
  },

  // Gradient Styles
  gradientHeader: {
    backgroundColor: Colors.primary,
  },

  // Border Styles
  border: {
    borderWidth: 1,
    borderColor: Colors.border,
  },

  borderLight: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },

  borderAccent: {
    borderWidth: 2,
    borderColor: Colors.accent,
  },
};

export default {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
  CommonStyles,
};