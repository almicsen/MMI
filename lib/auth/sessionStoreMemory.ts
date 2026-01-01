import { SessionRecord, SessionStore } from './sessionManager';

export class MemorySessionStore implements SessionStore {
  private records: Map<string, SessionRecord>;

  constructor(seed?: SessionRecord[]) {
    this.records = new Map(seed?.map((record) => [record.tokenHash, record]));
  }

  async get(tokenHash: string): Promise<SessionRecord | null> {
    return this.records.get(tokenHash) || null;
  }

  async set(record: SessionRecord): Promise<void> {
    this.records.set(record.tokenHash, record);
  }

  async update(tokenHash: string, updates: Partial<SessionRecord>): Promise<void> {
    const existing = this.records.get(tokenHash);
    if (!existing) return;
    this.records.set(tokenHash, { ...existing, ...updates });
  }

  snapshot(): SessionRecord[] {
    return Array.from(this.records.values());
  }
}
