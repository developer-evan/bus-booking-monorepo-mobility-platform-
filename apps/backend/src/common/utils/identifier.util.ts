export function isEmailIdentifier(value: string): boolean {
  return value.includes('@');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string): string {
  return phone.trim();
}

export function normalizeIdentifier(identifier: string): string {
  return isEmailIdentifier(identifier)
    ? normalizeEmail(identifier)
    : normalizePhone(identifier);
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
