/**
 * Utilidades de colores para la aplicación
 * Estas funciones pueden ser usadas en todo el frontend (admin, estudiantes, conductores)
 */

/**
 * Obtiene el color asociado a un rol específico
 * @param {string} roleName - Nombre del rol (admin, pasajero, conductor)
 * @returns {string} Color hexadecimal
 */
export const getRoleColor = (roleName) => {
  const roleColors = {
    admin: '#D32F2F',      // Rojo oscuro
    pasajero: '#1976D2',   // Azul
    conductor: '#388E3C',  // Verde
  };
  return roleColors[roleName?.toLowerCase()] || '#757575'; // Gris por defecto
};

/**
 * Obtiene el color basado en el estado activo/inactivo
 * @param {boolean} isActive - Estado del usuario
 * @returns {string} Color hexadecimal
 */
export const getStatusColor = (isActive) => {
  return isActive ? '#4CAF50' : '#F44336'; // Verde para activo, rojo para inactivo
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
