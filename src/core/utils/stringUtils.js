/**
 * Utilidades para manipulación y formateo de cadenas de texto.
 */

/**
 * Obtiene las iniciales (hasta 2 letras en mayúscula) a partir del nombre de un usuario.
 * Si no se proporciona un nombre válido, retorna el valor de reserva (fallback).
 *
 * @param {string} fullName - Nombre completo del usuario.
 * @param {string} fallback - Cadena de texto a retornar si el nombre está vacío o no es válido (por defecto "U").
 * @returns {string} Las iniciales en mayúsculas (máximo 2 caracteres).
 */
export function getUserInitials(fullName, fallback = "U") {
  if (!fullName || typeof fullName !== "string") {
    return fallback;
  }

  const trimmedName = fullName.trim();
  if (trimmedName.length === 0) {
    return fallback;
  }

  const nameParts = trimmedName.split(/\s+/).filter(Boolean);
  if (nameParts.length === 0) {
    return fallback;
  }

  return nameParts
    .map((nameSegment) => nameSegment[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
