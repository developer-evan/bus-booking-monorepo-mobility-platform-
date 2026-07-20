export function buildActivateAccountUrl(): string {
  if (typeof window === 'undefined') {
    return '/auth/activate';
  }

  return `${window.location.origin}/auth/activate`;
}

export async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
