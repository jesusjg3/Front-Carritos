/**
 * Constantes de tema y estilo para la aplicación
 */

// Colores principales del sistema
export const COLORS = {
  // Primarios
  PRIMARY: '#144985',
  PRIMARY_DARK: '#0D3461',
  PRIMARY_LIGHT: '#1E88E5',
  
  // Secundarios
  SECONDARY: '#FF6B6B',
  
  // Estados
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  INFO: '#2196F3',
  
  // Roles
  ADMIN: '#d32f2f',
  PASSENGER: '#144985',
  DRIVER: '#1E88E5',
  
  // Neutros
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY_50: '#FAFAFA',
  GRAY_100: '#F5F5F5',
  GRAY_200: '#EEEEEE',
  GRAY_300: '#E0E0E0',
  GRAY_400: '#BDBDBD',
  GRAY_500: '#9E9E9E',
  GRAY_600: '#757575',
  GRAY_700: '#616161',
  GRAY_800: '#424242',
  GRAY_900: '#212121',
  
  // Fondos
  BACKGROUND: '#F5F5F5',
  SURFACE: '#FFFFFF',
  
  // Bordes
  BORDER: '#E0E0E0',
};

// Espaciado consistente
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
};

// Tamaños de fuente
export const FONT_SIZES = {
  XS: 10,
  SM: 12,
  MD: 14,
  LG: 16,
  XL: 20,
  XXL: 24,
  XXXL: 32,
};

// Bordes redondeados
export const BORDER_RADIUS = {
  SM: 4,
  MD: 8,
  LG: 12,
  XL: 16,
  ROUND: 50,
};

// Sombras
export const SHADOWS = {
  SMALL: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  MEDIUM: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  LARGE: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};
