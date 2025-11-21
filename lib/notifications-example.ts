/**
 * Example usage of MMI Notifications
 * 
 * This file demonstrates how to use the notification system
 * Copy these examples into your components or API routes
 */

import { MMINotifications } from './notifications';

// ============================================
// Example 1: Send welcome email to new user
// ============================================
export async function welcomeNewUser(userEmail: string) {
  await MMINotifications.email(userEmail, 'welcome');
}

// ============================================
// Example 2: Notify user about new content
// ============================================
export async function notifyNewContent(userEmail: string, contentTitle: string) {
  await MMINotifications.notify(userEmail, 'new-content', {
    title: contentTitle,
  });
}

// ============================================
// Example 3: Notify about project update
// ============================================
export async function notifyProjectUpdate(userEmail: string, projectName: string, status: string) {
  await MMINotifications.email(userEmail, 'project-update', {
    projectName,
    status,
  });
}

// ============================================
// Example 4: Notify employee about upload approval
// ============================================
export async function notifyUploadApproved(userEmail: string, uploadTitle: string) {
  await MMINotifications.notify(userEmail, 'upload-approved', {
    title: uploadTitle,
  });
}

// ============================================
// Example 5: Notify user about role change
// ============================================
export async function notifyRoleChange(userEmail: string, newRole: string) {
  await MMINotifications.email(userEmail, 'role-changed', {
    role: newRole,
  });
}

// ============================================
// Example 6: Register custom template
// ============================================
MMINotifications.registerTemplate('custom-alert', {
  subject: 'Alert: {{alertType}}',
  body: 'You have a new {{alertType}} alert: {{message}}',
  html: '<h2>{{alertType}} Alert</h2><p>{{message}}</p>',
  pushTitle: 'New Alert',
  pushBody: '{{alertType}}: {{message}}',
});

// Then use it:
// await MMINotifications.email('user@example.com', 'custom-alert', {
//   alertType: 'Security',
//   message: 'Your account was accessed from a new device',
// });

