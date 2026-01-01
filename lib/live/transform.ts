import { LiveShow } from '@/lib/firebase/types';
import { liveShowSchema } from '@/lib/validators/live';
import { sanitizePlainText } from '@/lib/utils/sanitize';

export function normalizeStartTime(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (typeof value === 'object' && value && 'seconds' in value) {
    const seconds = (value as { seconds: number }).seconds;
    return new Date(seconds * 1000);
  }
  return new Date();
}

export function mapLiveShow(id: string, data: unknown): LiveShow | null {
  const parsed = liveShowSchema.safeParse(data);
  if (!parsed.success) return null;
  return {
    id,
    title: sanitizePlainText(parsed.data.title),
    prize: parsed.data.prize,
    startTime: normalizeStartTime(parsed.data.startTime),
    status: parsed.data.status,
  };
}
