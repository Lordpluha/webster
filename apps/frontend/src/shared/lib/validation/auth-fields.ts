export type LoginFieldErrors = {
  email?: string;
  password?: string;
  twoFactorCode?: string;
};

export type RegisterFieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginFields(input: {
  email: string;
  password: string;
  twoFactorCode?: string;
  requireTwoFactor?: boolean;
}): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const email = input.email.trim();

  if (!email) {
    errors.email = "Email is required";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email";
  }

  if (!input.password) {
    errors.password = "Password is required";
  } else if (input.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  if (input.requireTwoFactor && !input.twoFactorCode?.trim()) {
    errors.twoFactorCode = "Enter the 2FA code";
  }

  return errors;
}

export function validateRegisterFields(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  const email = input.email.trim();

  if (!input.firstName.trim()) {
    errors.firstName = "First name is required";
  }
  if (!input.lastName.trim()) {
    errors.lastName = "Last name is required";
  }
  if (!email) {
    errors.email = "Email is required";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email";
  }
  if (!input.password) {
    errors.password = "Password is required";
  } else if (input.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }
  if (!input.confirmPassword) {
    errors.confirmPassword = "Confirm your password";
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
}

export function hasFieldErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
