const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SEARCH_LENGTH = 200;
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_RESUME_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_RESUME_EXTENSIONS = ['.pdf', '.doc', '.docx'];

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function sanitizeSearchInput(input: string): string {
  return input.slice(0, MAX_SEARCH_LENGTH).trim();
}

export function validateResumeFile(file: { name?: string; type?: string; size?: number | null }): { valid: boolean; error?: string } {
  if (!file.name) {
    return { valid: false, error: 'No file name provided' };
  }

  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
  if (!ALLOWED_RESUME_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Invalid file type. Allowed: ${ALLOWED_RESUME_EXTENSIONS.join(', ')}` };
  }

  if (file.size && file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return { valid: false, error: `File too large. Maximum size: ${MAX_FILE_SIZE_MB}MB` };
  }

  return { valid: true };
}

export function sanitizeTextInput(input: string, maxLength: number): string {
  return input.slice(0, maxLength);
}
