import { describe, expect, it } from 'vitest';
import { contactMessageCreateSchema } from '@/lib/validators/contactMessage';

describe('contact message validation', () => {
  it('accepts valid payload', () => {
    const result = contactMessageCreateSchema.safeParse({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Business Inquiry',
      message: 'Looking to discuss a partnership opportunity for a new media experience.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects too-short messages', () => {
    const result = contactMessageCreateSchema.safeParse({
      subject: 'Hi',
      message: 'Too short',
    });
    expect(result.success).toBe(false);
  });
});
