export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateUsername = (username) => {
  return username.length >= 3;
};

export const validatePassword = (password) => {
  return password.length >= 8;
};

export const validateLoginInput = (identifier) => {
  return validateEmail(identifier) || validateUsername(identifier);
};

export const validateLoginForm = (data) => {
  const errors = {};
  
  if (!data.identifier) {
    errors.identifier = 'Email or username is required';
  } else if (!validateLoginInput(data.identifier)) {
    errors.identifier = 'Invalid email or username format';
  }
  
  if (!data.password) {
    errors.password = 'Password is required';
  } else if (!validatePassword(data.password)) {
    errors.password = 'Password must be at least 8 characters';
  }
  
  return errors;
};
