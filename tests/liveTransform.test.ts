import { describe, expect, it } from 'vitest';
import { mapLiveShow, normalizeStartTime } from '@/lib/live/transform';

const baseShow = {
  title: 'HQ Trivia',
  prize: 10000,
  startTime: '2025-01-01T02:00:00.000Z',
  status: 'scheduled',
};

describe('live show transform', () => {
  it('maps valid live shows', () => {
    const show = mapLiveShow('show-1', baseShow);
    expect(show?.title).toBe('HQ Trivia');
    expect(show?.prize).toBe(10000);
    expect(show?.status).toBe('scheduled');
  });

  it('returns null for invalid data', () => {
    const show = mapLiveShow('show-2', { title: '', prize: -1, startTime: '', status: 'invalid' });
    expect(show).toBeNull();
  });

  it('normalizes Firestore timestamps', () => {
    const date = normalizeStartTime({ seconds: 1728000000 });
    expect(date).toBeInstanceOf(Date);
  });
});
