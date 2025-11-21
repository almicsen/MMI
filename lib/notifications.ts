/**
 * MMI Notifications - Local implementation for this project
 * This wraps the @mmi/notifications package for easy use in Next.js
 */

import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase/config';

export interface NotificationOptions {
  type: 'email' | 'push' | 'both';
  to: string | string[]; // Email address or user UID(s)
  template: string;
  data?: Record<string, any>;
  subject?: string;
  priority?: 'low' | 'normal' | 'high';
}

const templates: Record<string, any> = {
  welcome: {
    subject: 'Welcome to MobileMediaInteractions!',
    body: 'Welcome! We\'re excited to have you on board.',
    html: '<h1>Welcome!</h1><p>We\'re excited to have you on board.</p>',
    pushTitle: 'Welcome!',
    pushBody: 'Welcome to MobileMediaInteractions!',
  },
  'new-content': {
    subject: 'New Content Available',
    body: 'New content has been added: {{title}}',
    html: '<h2>New Content Available</h2><p>New content has been added: <strong>{{title}}</strong></p>',
    pushTitle: 'New Content',
    pushBody: '{{title}} is now available!',
  },
  'project-update': {
    subject: 'Project Update: {{projectName}}',
    body: '{{projectName}} status has been updated to {{status}}',
    html: '<h2>Project Update</h2><p><strong>{{projectName}}</strong> status: <em>{{status}}</em></p>',
    pushTitle: 'Project Update',
    pushBody: '{{projectName}}: {{status}}',
  },
  'upload-approved': {
    subject: 'Your Upload Has Been Approved',
    body: 'Your upload "{{title}}" has been approved and is now live!',
    html: '<h2>Upload Approved</h2><p>Your upload "<strong>{{title}}</strong>" has been approved and is now live!</p>',
    pushTitle: 'Upload Approved',
    pushBody: '{{title}} is now live!',
  },
  'upload-rejected': {
    subject: 'Upload Review: {{title}}',
    body: 'Your upload "{{title}}" needs changes: {{reason}}',
    html: '<h2>Upload Review</h2><p>Your upload "<strong>{{title}}</strong>" needs changes:</p><p>{{reason}}</p>',
    pushTitle: 'Upload Review',
    pushBody: '{{title}} needs changes',
  },
  'role-changed': {
    subject: 'Your Role Has Been Updated',
    body: 'Your role has been changed to {{role}}',
    html: '<h2>Role Updated</h2><p>Your role has been changed to <strong>{{role}}</strong></p>',
    pushTitle: 'Role Updated',
    pushBody: 'Your role is now {{role}}',
  },
};

function replaceVariables(text: string, data: Record<string, any>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
}

/**
 * Send a notification
 * Usage: sendNotification({ type: 'email', to: 'user@example.com', template: 'welcome' })
 */
export async function sendNotification(options: NotificationOptions): Promise<void> {
  const template = templates[options.template];
  if (!template) {
    throw new Error(`Template "${options.template}" not found`);
  }

  const recipients = Array.isArray(options.to) ? options.to : [options.to];

  for (const recipient of recipients) {
    const notificationData = {
      type: options.type,
      to: recipient,
      template: options.template,
      data: options.data || {},
      subject: options.subject || replaceVariables(template.subject || '', options.data || {}),
      body: replaceVariables(template.body, options.data || {}),
      html: template.html ? replaceVariables(template.html, options.data || {}) : undefined,
      pushTitle: replaceVariables(template.pushTitle || template.subject || '', options.data || {}),
      pushBody: replaceVariables(template.pushBody || template.body, options.data || {}),
      priority: options.priority || 'normal',
      status: 'pending',
      createdAt: Timestamp.now(),
    };

    await addDoc(collection(db, 'notifications'), notificationData);
  }
}

/**
 * Quick send methods
 */
export async function sendEmail(
  to: string | string[],
  template: string,
  data?: Record<string, any>
): Promise<void> {
  return sendNotification({ type: 'email', to, template, data });
}

export async function sendPush(
  to: string | string[],
  template: string,
  data?: Record<string, any>
): Promise<void> {
  return sendNotification({ type: 'push', to, template, data });
}

export async function sendBoth(
  to: string | string[],
  template: string,
  data?: Record<string, any>
): Promise<void> {
  return sendNotification({ type: 'both', to, template, data });
}

/**
 * Register a custom template
 */
export function registerTemplate(name: string, template: any): void {
  templates[name] = template;
}

// Export for easy access
export const MMINotifications = {
  send: sendNotification,
  email: sendEmail,
  push: sendPush,
  notify: sendBoth,
  registerTemplate,
};

