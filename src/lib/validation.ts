import { isValidGroup, VALID_GROUPS, type GroupName } from "@/types";

// ============================================================
// Validación compartida (se usa tanto en el frontend como en el
// backend). El backend SIEMPRE vuelve a validar todo, sin confiar
// en lo que haya validado el navegador.
// ============================================================

export const MIN_PASSWORD_LENGTH = 6;
export const MAX_PASSWORD_LENGTH = 72; // límite práctico de bcrypt
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 40;
export const MIN_FULL_NAME_LENGTH = 3;
export const MAX_FULL_NAME_LENGTH = 150;

export interface FieldError {
  field: string;
  message: string;
}

/**
 * Normaliza un nombre de usuario para que "Samuel123", "samuel123"
 * y "SAMUEL123" se traten como la misma cuenta. Se debe aplicar
 * exactamente igual en registro y en login.
 */
export function normalizeUsername(rawUsername: string): string {
  return rawUsername.trim().toLowerCase();
}

export function validateFullName(fullName: unknown): string | null {
  if (typeof fullName !== "string") return "El nombre completo es obligatorio.";
  const trimmed = fullName.trim();
  if (trimmed.length < MIN_FULL_NAME_LENGTH) {
    return "El nombre completo es demasiado corto.";
  }
  if (trimmed.length > MAX_FULL_NAME_LENGTH) {
    return "El nombre completo es demasiado largo.";
  }
  return null;
}

export function validateUsername(username: unknown): string | null {
  if (typeof username !== "string") return "El usuario es obligatorio.";
  const normalized = normalizeUsername(username);
  if (normalized.length < MIN_USERNAME_LENGTH) {
    return `El usuario debe tener al menos ${MIN_USERNAME_LENGTH} caracteres.`;
  }
  if (normalized.length > MAX_USERNAME_LENGTH) {
    return `El usuario debe tener máximo ${MAX_USERNAME_LENGTH} caracteres.`;
  }
  if (!/^[\p{L}\p{N}._-]+$/u.test(normalized)) {
    return "El usuario solo puede contener letras, números, puntos, guiones y guiones bajos.";
  }
  return null;
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== "string") return "La contraseña es obligatoria.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return "La contraseña es demasiado larga.";
  }
  return null;
}

export function validateGroupName(groupName: unknown): string | null {
  if (!isValidGroup(groupName)) {
    return `El grupo debe ser uno de: ${VALID_GROUPS.join(", ")}.`;
  }
  return null;
}

export interface RegisterInput {
  fullName: string;
  username: string;
  password: string;
  confirmPassword: string;
  groupName: GroupName;
}

export interface RegisterValidationResult {
  valid: boolean;
  errors: FieldError[];
  data?: {
    fullName: string;
    username: string;
    password: string;
    groupName: GroupName;
  };
}

export function validateRegisterInput(body: unknown): RegisterValidationResult {
  const errors: FieldError[] = [];

  const b = (body ?? {}) as Record<string, unknown>;

  const fullNameError = validateFullName(b.fullName);
  if (fullNameError) errors.push({ field: "fullName", message: fullNameError });

  const usernameError = validateUsername(b.username);
  if (usernameError) errors.push({ field: "username", message: usernameError });

  const passwordError = validatePassword(b.password);
  if (passwordError) errors.push({ field: "password", message: passwordError });

  if (typeof b.password === "string" && typeof b.confirmPassword === "string") {
    if (b.password !== b.confirmPassword) {
      errors.push({
        field: "confirmPassword",
        message: "Las contraseñas no coinciden.",
      });
    }
  } else if (!b.confirmPassword) {
    errors.push({
      field: "confirmPassword",
      message: "Debes confirmar la contraseña.",
    });
  }

  const groupError = validateGroupName(b.groupName);
  if (groupError) errors.push({ field: "groupName", message: groupError });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      fullName: (b.fullName as string).trim(),
      username: normalizeUsername(b.username as string),
      password: b.password as string,
      groupName: b.groupName as GroupName,
    },
  };
}

export interface LoginValidationResult {
  valid: boolean;
  errors: FieldError[];
  data?: { username: string; password: string };
}

export function validateLoginInput(body: unknown): LoginValidationResult {
  const errors: FieldError[] = [];
  const b = (body ?? {}) as Record<string, unknown>;

  if (typeof b.username !== "string" || b.username.trim().length === 0) {
    errors.push({ field: "username", message: "El usuario es obligatorio." });
  }
  if (typeof b.password !== "string" || b.password.length === 0) {
    errors.push({ field: "password", message: "La contraseña es obligatoria." });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      username: normalizeUsername(b.username as string),
      password: b.password as string,
    },
  };
}
