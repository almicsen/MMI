import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function logAdminAction(params: {
  actorId: string;
  action: string;
  targetType: 'contact-message';
  targetId: string;
  metadata?: Record<string, unknown>;
}) {
  const now = new Date();
  await adminDb.collection('adminAuditLogs').add({
    actorId: params.actorId,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    metadata: params.metadata ?? null,
    createdAt: Timestamp.fromDate(now),
  });
}
