export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

export const isValidName = (name) => {
  return name && name.trim().length >= 3 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name.trim());
};

export const passwordsMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};
