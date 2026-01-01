import { z } from 'zod';

export const contactMessageCreateSchema = z.object({
  subject: z.string().min(3).max(120),
  message: z.string().min(20).max(2000),
  name: z.string().max(120).optional().nullable(),
  email: z.string().email().optional().nullable(),
  metadata: z
    .object({
      userAgent: z.string().max(300).optional(),
      appVersion: z.string().max(40).optional(),
      pageUrl: z.string().url().optional(),
      deviceType: z.enum(['mobile', 'tablet', 'desktop']).optional(),
    })
    .optional(),
});

export const contactMessageUpdateSchema = z.object({
  status: z.enum(['new', 'open', 'closed']).optional(),
  internalNotes: z.string().max(2000).optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  tags: z.array(z.string().max(24)).max(10).optional(),
});
