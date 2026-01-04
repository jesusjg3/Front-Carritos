/**
 * Utilidades de colores para la aplicación
 * Estas funciones pueden ser usadas en todo el frontend (admin, estudiantes, conductores)
 */

import { COLORS } from '../constants/theme';

/**
 * Obtiene el color asociado a un rol específico
 * @param {string} roleName - Nombre del rol (admin, pasajero, conductor)
 * @returns {string} Color hexadecimal
 */
export const getRoleColor = (roleName) => {
  const roleColors = {
    admin: COLORS.ADMIN,
    pasajero: COLORS.PASSENGER,
    conductor: COLORS.DRIVER,
  };
  return roleColors[roleName?.toLowerCase()] || COLORS.GRAY_500;
};

/**
 * Obtiene el color basado en el estado activo/inactivo
 * @param {boolean} isActive - Estado del usuario
 * @returns {string} Color hexadecimal
 */
export const getStatusColor = (isActive) => {
  return isActive ? COLORS.SUCCESS : COLORS.ERROR;
};

/**
 * Obtiene un color de avatar basado en el nombre del usuario
 * @param {string} name - Nombre del usuario
 * @returns {string} Color hexadecimal
 */
export const getAvatarColor = (name) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
  ];
  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

/**
 * Obtiene el color según el tipo de viaje
 * @param {string} tripType - Tipo de viaje
 * @returns {string} Color hexadecimal
 */
export const getTripColor = (tripType) => {
  const tripColors = {
    pending: '#FF9800',    // Naranja
    active: '#2196F3',     // Azul
    completed: '#4CAF50',  // Verde
    cancelled: '#F44336',  // Rojo
  };
  return tripColors[tripType?.toLowerCase()] || '#9E9E9E';
};
