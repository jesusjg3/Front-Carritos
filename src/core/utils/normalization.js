/**
 * Utilidades para normalización de datos del usuario y rol
 */

/**
 * Normaliza la información del rol de un usuario
 * El backend devuelve roles en diferentes formatos dependiendo del endpoint
 * Esta función asegura una estructura consistente
 * 
 * @param {Object} user - Objeto de usuario
 * @returns {Object} Usuario con estructura normalizada de rol
 */
export const normalizeUserRole = (user) => {
  if (!user) return user;

  // Si ya tiene un objeto rol con rol_name, devolver como está
  if (user.rol && typeof user.rol === 'object' && user.rol.rol_name) {
    return user;
  }

  // Si tiene un string role, convertir a objeto rol
  if (user.role && typeof user.role === 'string') {
    return {
      ...user,
      rol: {
        rol_name: user.role,
        id: user.role_id,
      },
    };
  }

  return user;
};

/**
 * Obtiene el nombre del rol de un usuario
 * Funciona con ambas estructuras (rol string o rol object)
 * 
 * @param {Object} user - Objeto de usuario
 * @returns {string} Nombre del rol
 */
export const getUserRole = (user) => {
  if (!user) return null;
  
  // Estructura del backend en /users endpoint
  if (user.rol && typeof user.rol === 'object') {
    return user.rol.rol_name;
  }
  
  // Estructura del backend en login/register endpoint
  if (user.role && typeof user.role === 'string') {
    return user.role;
  }
  
  return null;
};

/**
 * Verifica si un usuario es admin
 * @param {Object} user - Objeto de usuario
 * @returns {boolean} true si el usuario es admin
 */
export const isUserAdmin = (user) => {
  return getUserRole(user) === 'admin';
};

/**
 * Verifica si un usuario es conductor
 * @param {Object} user - Objeto de usuario
 * @returns {boolean} true si el usuario es conductor
 */
export const isUserDriver = (user) => {
  return getUserRole(user) === 'conductor';
};

/**
 * Verifica si un usuario es pasajero
 * @param {Object} user - Objeto de usuario
 * @returns {boolean} true si el usuario es pasajero
 */
export const isUserPassenger = (user) => {
  return getUserRole(user) === 'pasajero';
};
