/**
 * Frontend validation utilities matching backend validation rules
 * Must stay in sync with pkg/validation/validation.go
 */

// Email regex (simplified RFC 5322)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// Display name regex (letters, numbers, spaces, basic punctuation)
const DISPLAY_NAME_REGEX = /^[a-zA-Z0-9\s\-_'.]+$/;

// Sector format regex (X.Y.Z where X, Y, Z are integers, can be negative)
const SECTOR_REGEX = /^-?\d+\.-?\d+\.-?\d+$/;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email format
 * Rules: Required, max 254 chars, RFC 5322 format
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Email is required' };
  }

  if (trimmed.length > 254) {
    return { isValid: false, error: 'Email must be 254 characters or less' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

/**
 * Validate display name
 * Rules: 3-32 chars, alphanumeric + spaces + basic punctuation (- _ ' .)
 */
export function validateDisplayName(name: string): ValidationResult {
  const trimmed = name.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Display name is required' };
  }

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Display name must be at least 3 characters' };
  }

  if (trimmed.length > 32) {
    return { isValid: false, error: 'Display name must be 32 characters or less' };
  }

  if (!DISPLAY_NAME_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Display name can only contain letters, numbers, spaces, and basic punctuation' };
  }

  return { isValid: true };
}

/**
 * Validate character/ship name
 * Rules: 3-32 chars, alphanumeric + spaces + basic punctuation (- _ ' .)
 */
export function validateName(name: string): ValidationResult {
  const trimmed = name.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Name is required' };
  }

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Name must be at least 3 characters' };
  }

  if (trimmed.length > 32) {
    return { isValid: false, error: 'Name must be 32 characters or less' };
  }

  if (!DISPLAY_NAME_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Name can only contain letters, numbers, spaces, and basic punctuation' };
  }

  return { isValid: true };
}

/**
 * Validate password
 * Rules: 8-128 chars
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password must be 128 characters or less' };
  }

  return { isValid: true };
}

/**
 * Validate chat message
 * Rules: 1-500 chars
 */
export function validateMessage(content: string): ValidationResult {
  const trimmed = content.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Message cannot be empty' };
  }

  if (content.length > 500) {
    return { isValid: false, error: 'Message must be 500 characters or less' };
  }

  return { isValid: true };
}

/**
 * Validate sector format
 * Rules: X.Y.Z format where X, Y, Z are integers (can be negative)
 */
export function validateSectorFormat(sector: string): ValidationResult {
  const trimmed = sector.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Sector is required' };
  }

  if (!SECTOR_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Sector must be in X.Y.Z format (e.g., 0.0.0)' };
  }

  return { isValid: true };
}

/**
 * Validate room name
 * Rules: 3-50 chars, alphanumeric + spaces + basic punctuation
 */
export function validateRoomName(name: string): ValidationResult {
  const trimmed = name.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Room name is required' };
  }

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Room name must be at least 3 characters' };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: 'Room name must be 50 characters or less' };
  }

  if (!DISPLAY_NAME_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Room name can only contain letters, numbers, spaces, and basic punctuation' };
  }

  return { isValid: true };
}

// Helper to check if a string is valid (non-empty after trim)
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

// Helper to check string length
export function isValidLength(value: string, min: number, max: number): boolean {
  const len = value.trim().length;
  return len >= min && len <= max;
}
