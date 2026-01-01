import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createSessionManager, SESSION_ROTATION_DAYS, SESSION_TTL_DAYS } from '@/lib/auth/sessionManager';
import { MemorySessionStore } from '@/lib/auth/sessionStoreMemory';

const advanceDays = (days: number) => {
  const now = new Date();
  now.setDate(now.getDate() + days);
  vi.setSystemTime(now);
};

describe('session manager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('persists sessions across restarts', async () => {
    const store = new MemorySessionStore();
    const manager = createSessionManager(store);
    const session = await manager.createSession('user-123', { userAgent: 'test' });

    const persisted = store.snapshot();
    const newStore = new MemorySessionStore(persisted);
    const newManager = createSessionManager(newStore);

    const touched = await newManager.touchSession(session.token);
    expect(touched?.userId).toBe('user-123');
  });

  it('rotates sessions on refresh after rotation window', async () => {
    const store = new MemorySessionStore();
    const manager = createSessionManager(store);
    const session = await manager.createSession('user-123', {});

    advanceDays(SESSION_ROTATION_DAYS + 1);
    const rotated = await manager.rotateSession(session.token, { userAgent: 'refresh' });

    expect(rotated?.rotated).toBe(true);
    expect(rotated?.token).not.toBe(session.token);
  });

  it('invalidates session on logout', async () => {
    const store = new MemorySessionStore();
    const manager = createSessionManager(store);
    const session = await manager.createSession('user-123', {});

    await manager.revokeSession(session.token, 'logout');
    const touched = await manager.touchSession(session.token);

    expect(touched).toBeNull();
  });

  it('expires sessions after 30 days of inactivity', async () => {
    const store = new MemorySessionStore();
    const manager = createSessionManager(store);
    const session = await manager.createSession('user-123', {});

    advanceDays(SESSION_TTL_DAYS + 1);
    const touched = await manager.touchSession(session.token);

    expect(touched).toBeNull();
  });
});
