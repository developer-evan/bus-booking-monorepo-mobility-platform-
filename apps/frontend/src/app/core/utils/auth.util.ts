export function generateSeatLabels(capacity: number): string[] {
  const seats: string[] = [];
  const columns = 4;

  for (let index = 0; index < capacity; index++) {
    const row = String.fromCharCode(65 + Math.floor(index / columns));
    const column = (index % columns) + 1;
    seats.push(`${row}${column}`);
  }

  return seats;
}

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as { error?: unknown }).error === 'object' &&
    (error as { error: { message?: unknown } }).error !== null
  ) {
    const message = (error as { error: { message?: unknown } }).error.message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message)) {
      return message.join(', ');
    }
  }

  return fallback;
}
