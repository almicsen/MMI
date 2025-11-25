/**
 * Telemetry and Error Logging System
 * Logs errors, warnings, and events to Firestore for admin review
 */

import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export type TelemetryType = 'error' | 'warning' | 'info' | 'event';
export type TelemetrySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface TelemetryLog {
  id?: string;
  type: TelemetryType;
  severity: TelemetrySeverity;
  message: string;
  details?: any;
  path?: string;
  userAgent?: string;
  userId?: string;
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  domain?: string; // Track which domain the error came from
  suggestedFix?: string; // Suggested fix for the issue
}

export interface SiteIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  severity: TelemetrySeverity;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  resolved: boolean;
  relatedLogs?: string[]; // IDs of related telemetry logs
  suggestedFixes?: string[]; // Array of suggested fixes
  impact?: string; // Impact description
}

/**
 * Check if we're in production (not localhost)
 */
function isProduction(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  // Only log from production domains
  return hostname.includes('mobilemediainteractions.com') || 
         hostname.includes('vercel.app') ||
         (hostname !== 'localhost' && !hostname.includes('127.0.0.1') && !hostname.includes('0.0.0.0'));
}

/**
 * Generate suggested fixes based on error message
 */
function generateSuggestedFixes(message: string, details?: any): string[] {
  const fixes: string[] = [];
  const errorMsg = message.toLowerCase();
  const detailsStr = typeof details === 'string' ? details.toLowerCase() : JSON.stringify(details || {}).toLowerCase();

  // Network errors
  if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('failed to fetch')) {
    fixes.push('Check network connectivity and API endpoints');
    fixes.push('Verify CORS settings if calling external APIs');
    fixes.push('Check if the service is running and accessible');
  }

  // Firebase errors
  if (errorMsg.includes('firebase') || errorMsg.includes('permission') || detailsStr.includes('permission-denied')) {
    fixes.push('Review Firestore security rules');
    fixes.push('Verify user authentication status');
    fixes.push('Check if user has required role/permissions');
  }

  // Authentication errors
  if (errorMsg.includes('auth') || errorMsg.includes('unauthorized') || errorMsg.includes('login')) {
    fixes.push('Verify user is logged in');
    fixes.push('Check authentication token validity');
    fixes.push('Review session expiration settings');
  }

  // 404 errors
  if (errorMsg.includes('404') || errorMsg.includes('not found')) {
    fixes.push('Verify the route/page exists');
    fixes.push('Check if the resource was deleted or moved');
    fixes.push('Review routing configuration');
  }

  // Storage errors
  if (errorMsg.includes('storage') || errorMsg.includes('upload') || errorMsg.includes('cloudinary')) {
    fixes.push('Check storage service configuration');
    fixes.push('Verify file size limits');
    fixes.push('Review storage permissions and quotas');
  }

  // Generic errors
  if (fixes.length === 0) {
    fixes.push('Review error details and stack trace');
    fixes.push('Check browser console for additional information');
    fixes.push('Verify related services are operational');
  }

  return fixes;
}

/**
 * Log an error, warning, or event to telemetry
 * Only logs in production (not localhost)
 */
export async function logTelemetry(
  type: TelemetryType,
  severity: TelemetrySeverity,
  message: string,
  details?: any
): Promise<void> {
  // Only log in production
  if (!isProduction()) {
    console.log('[Telemetry] Skipping log in development:', message);
    return;
  }

  try {
    const suggestedFixes = generateSuggestedFixes(message, details);
    const log: Omit<TelemetryLog, 'id'> = {
      type,
      severity,
      message,
      details: details ? JSON.stringify(details) : undefined,
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      domain: typeof window !== 'undefined' ? window.location.hostname : undefined,
      suggestedFix: suggestedFixes.join(' | '),
      timestamp: Timestamp.now() as any,
      resolved: false,
    };

    await addDoc(collection(db, 'telemetry'), log);
  } catch (error) {
    console.error('Failed to log telemetry:', error);
  }
}

/**
 * Log an error
 */
export async function logError(
  message: string,
  error?: Error | any,
  severity: TelemetrySeverity = 'high'
): Promise<void> {
  await logTelemetry('error', severity, message, {
    error: error?.message,
    stack: error?.stack,
    name: error?.name,
  });
}

/**
 * Log a warning
 */
export async function logWarning(
  message: string,
  details?: any,
  severity: TelemetrySeverity = 'medium'
): Promise<void> {
  await logTelemetry('warning', severity, message, details);
}

/**
 * Log an info event
 */
export async function logInfo(message: string, details?: any): Promise<void> {
  await logTelemetry('info', 'low', message, details);
}

/**
 * Get recent telemetry logs
 */
export async function getTelemetryLogs(
  limitCount: number = 100,
  type?: TelemetryType,
  severity?: TelemetrySeverity
): Promise<TelemetryLog[]> {
  try {
    let q = query(
      collection(db, 'telemetry'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    if (type) {
      q = query(q, where('type', '==', type));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
        resolvedAt: data.resolvedAt?.toDate ? data.resolvedAt.toDate() : undefined,
      } as TelemetryLog;
    });
  } catch (error) {
    console.error('Error fetching telemetry logs:', error);
    return [];
  }
}

/**
 * Mark a telemetry log as resolved
 */
export async function resolveTelemetryLog(
  logId: string,
  userId: string
): Promise<void> {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'telemetry', logId), {
      resolved: true,
      resolvedAt: Timestamp.now(),
      resolvedBy: userId,
    });
  } catch (error) {
    console.error('Error resolving telemetry log:', error);
    throw error;
  }
}

/**
 * Get aggregated site issues with suggested fixes
 */
export async function getSiteIssues(): Promise<SiteIssue[]> {
  try {
    const logs = await getTelemetryLogs(1000);
    const issuesMap = new Map<string, SiteIssue>();

    logs.forEach((log) => {
      if (log.resolved) return;
      // Only include production logs
      if (log.domain && (log.domain.includes('localhost') || log.domain.includes('127.0.0.1'))) {
        return;
      }

      const key = `${log.type}-${log.message}`;
      if (!issuesMap.has(key)) {
        const suggestedFixes = log.suggestedFix 
          ? log.suggestedFix.split(' | ')
          : generateSuggestedFixes(log.message, log.details);

        issuesMap.set(key, {
          id: key,
          type: log.type as 'error' | 'warning' | 'info',
          title: log.message,
          description: log.details || '',
          severity: log.severity,
          count: 0,
          firstSeen: log.timestamp,
          lastSeen: log.timestamp,
          resolved: false,
          relatedLogs: [],
          suggestedFixes,
          impact: getImpactDescription(log.severity, log.type),
        });
      }

      const issue = issuesMap.get(key)!;
      issue.count++;
      if (log.timestamp < issue.firstSeen) {
        issue.firstSeen = log.timestamp;
      }
      if (log.timestamp > issue.lastSeen) {
        issue.lastSeen = log.timestamp;
      }
      if (log.id) {
        issue.relatedLogs?.push(log.id);
      }
    });

    return Array.from(issuesMap.values()).sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  } catch (error) {
    console.error('Error getting site issues:', error);
    return [];
  }
}

/**
 * Get impact description based on severity and type
 */
function getImpactDescription(severity: TelemetrySeverity, type: TelemetryType): string {
  if (severity === 'critical') {
    return 'Critical: Site functionality may be severely impacted. Immediate attention required.';
  } else if (severity === 'high') {
    return 'High: Significant functionality may be affected. Should be addressed soon.';
  } else if (severity === 'medium') {
    return 'Medium: Some functionality may be impacted. Review recommended.';
  } else {
    return 'Low: Minor issue with minimal impact. Monitor and address when convenient.';
  }
}

