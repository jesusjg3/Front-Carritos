/**
 * Utilidades de validación
 */

/**
 * Valida si un email tiene formato correcto
 * @param {string} email - Email a validar
 * @returns {boolean} - True si es válido
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida si una contraseña cumple requisitos mínimos
 * @param {string} password - Contraseña a validar
 * @returns {boolean} - True si es válida
 */
export const isValidPassword = (password) => {
  // Mínimo 6 caracteres
  return password && password.length >= 6;
};

/**
 * Valida si un nombre es válido
 * @param {string} name - Nombre a validar
 * @returns {boolean} - True si es válido
 */
export const isValidName = (name) => {
  return name && name.trim().length >= 2;
};

/**
 * Valida si dos contraseñas coinciden
 * @param {string} password - Contraseña
 * @param {string} confirmPassword - Confirmación
 * @returns {boolean} - True si coinciden
 */
export const passwordsMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};
