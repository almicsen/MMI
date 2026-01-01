export function sanitizePlainText(value: string): string {
  return value.replace(/[<>]/g, '').trim();
}
