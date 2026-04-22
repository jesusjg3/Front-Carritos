/**
 * Utilidades generales de formato
 */

/**
 * Capitaliza la primera letra de un string
 * @param {string} str - String a capitalizar
 * @returns {string} - String capitalizado
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Formatea un nombre completo
 * @param {string} firstName - Nombre
 * @param {string} lastName - Apellido
 * @returns {string} - Nombre formateado
 */
export const formatFullName = (firstName, lastName) => {
  return `${capitalize(firstName)} ${capitalize(lastName)}`;
};

/**
 * Trunca un texto a una longitud máxima
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - Texto truncado
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Formatea una fecha a string legible
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export const formatDate = (date) => {
  if (!date) return '';
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Obtiene las iniciales de un nombre
 * @param {string} name - Nombre completo
 * @returns {string} Iniciales (máximo 2 caracteres)
 */
export const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Formatea el nombre del rol para mostrar
 * @param {string} roleName - Nombre del rol
 * @returns {string} Nombre formateado
 */
export const formatRoleName = (roleName) => {
  const roleNames = {
    admin: 'Administrador',
    pasajero: 'Pasajero',
    conductor: 'Conductor',
  };
  return roleNames[roleName?.toLowerCase()] || roleName || 'Sin rol';
};

/**
 * Formatea el estado para mostrar
 * @param {boolean} isActive - Estado del usuario
 * @returns {string} Texto del estado
 */
export const formatStatus = (isActive) => {
  return isActive ? 'Activo' : 'Inactivo';
};

