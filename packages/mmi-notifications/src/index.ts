/**
 * @mmi/notifications
 * 
 * Plug-and-play notification system for MobileMediaInteractions platforms
 * 
 * Setup: MMINotifications.init({ firebaseConfig, emailConfig })
 * Usage: MMINotifications.send({ type: 'email', to: 'user@example.com', template: 'welcome' })
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { getFirestore, doc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';

export interface NotificationConfig {
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  emailConfig?: {
    serviceId?: string; // For services like SendGrid, Mailgun, etc.
    apiKey?: string;
    fromEmail?: string;
    fromName?: string;
  };
  vapidKey?: string; // For web push notifications
}

export interface NotificationOptions {
  type: 'email' | 'push' | 'both';
  to: string | string[]; // Email address or user UID(s)
  template: string;
  data?: Record<string, any>;
  subject?: string; // For email
  priority?: 'low' | 'normal' | 'high';
}

export interface NotificationTemplate {
  subject?: string;
  body: string;
  html?: string;
  pushTitle?: string;
  pushBody?: string;
}

class MMINotificationsClass {
  private app: FirebaseApp | null = null;
  private messaging: Messaging | null = null;
  private db: ReturnType<typeof getFirestore> | null = null;
  private config: NotificationConfig | null = null;
  private templates: Map<string, NotificationTemplate> = new Map();
  private initialized = false;

  /**
   * Initialize the notification system
   * One-line setup: MMINotifications.init({ firebaseConfig: {...} })
   */
  init(config: NotificationConfig): void {
    if (this.initialized) {
      console.warn('MMINotifications already initialized');
      return;
    }

    this.config = config;

    // Initialize Firebase if not already initialized
    if (!getApps().length) {
      this.app = initializeApp(config.firebaseConfig);
    } else {
      this.app = getApps()[0];
    }

    // Initialize Firestore
    this.db = getFirestore(this.app);

    // Initialize Messaging (only in browser)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        this.messaging = getMessaging(this.app);
      } catch (error) {
        console.warn('Firebase Messaging not available:', error);
      }
    }

    // Load default templates
    this.loadDefaultTemplates();

    this.initialized = true;
    console.log('✅ MMI Notifications initialized');
  }

  /**
   * Register a notification template
   * Usage: MMINotifications.registerTemplate('welcome', { subject: 'Welcome!', body: '...' })
   */
  registerTemplate(name: string, template: NotificationTemplate): void {
    this.templates.set(name, template);
  }

  /**
   * Send a notification
   * Usage: MMINotifications.send({ type: 'email', to: 'user@example.com', template: 'welcome' })
   */
  async send(options: NotificationOptions): Promise<void> {
    if (!this.initialized || !this.db) {
      throw new Error('MMINotifications not initialized. Call init() first.');
    }

    const template = this.templates.get(options.template);
    if (!template) {
      throw new Error(`Template "${options.template}" not found`);
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    for (const recipient of recipients) {
      // Store notification in Firestore (triggers Cloud Function or processes client-side)
      await addDoc(collection(this.db!, 'notifications'), {
        type: options.type,
        to: recipient,
        template: options.template,
        data: options.data || {},
        subject: options.subject || template.subject,
        body: template.body,
        html: template.html,
        pushTitle: template.pushTitle || template.subject,
        pushBody: template.pushBody || template.body,
        priority: options.priority || 'normal',
        status: 'pending',
        createdAt: Timestamp.now(),
      });
    }
  }

  /**
   * Quick send methods for common use cases
   */
  async email(to: string | string[], template: string, data?: Record<string, any>): Promise<void> {
    return this.send({ type: 'email', to, template, data });
  }

  async push(to: string | string[], template: string, data?: Record<string, any>): Promise<void> {
    return this.send({ type: 'push', to, template, data });
  }

  async notify(to: string | string[], template: string, data?: Record<string, any>): Promise<void> {
    return this.send({ type: 'both', to, template, data });
  }

  /**
   * Request push notification permission and get token
   * Usage: const token = await MMINotifications.requestPermission()
   */
  async requestPermission(): Promise<string | null> {
    if (!this.messaging || typeof window === 'undefined') {
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(this.messaging, {
          vapidKey: this.config?.vapidKey,
        });
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return null;
    }
  }

  /**
   * Listen for foreground push notifications
   * Usage: MMINotifications.onMessage((payload) => console.log(payload))
   */
  onMessage(callback: (payload: any) => void): void {
    if (!this.messaging) {
      console.warn('Messaging not available');
      return;
    }

    onMessage(this.messaging, callback);
  }

  /**
   * Load default templates
   */
  private loadDefaultTemplates(): void {
    // Welcome email
    this.registerTemplate('welcome', {
      subject: 'Welcome to MobileMediaInteractions!',
      body: 'Welcome! We\'re excited to have you on board.',
      html: '<h1>Welcome!</h1><p>We\'re excited to have you on board.</p>',
      pushTitle: 'Welcome!',
      pushBody: 'Welcome to MobileMediaInteractions!',
    });

    // New content
    this.registerTemplate('new-content', {
      subject: 'New Content Available',
      body: 'New content has been added: {{title}}',
      html: '<h2>New Content Available</h2><p>New content has been added: <strong>{{title}}</strong></p>',
      pushTitle: 'New Content',
      pushBody: '{{title}} is now available!',
    });

    // Project update
    this.registerTemplate('project-update', {
      subject: 'Project Update: {{projectName}}',
      body: '{{projectName}} status has been updated to {{status}}',
      html: '<h2>Project Update</h2><p><strong>{{projectName}}</strong> status: <em>{{status}}</em></p>',
      pushTitle: 'Project Update',
      pushBody: '{{projectName}}: {{status}}',
    });

    // Upload approved
    this.registerTemplate('upload-approved', {
      subject: 'Your Upload Has Been Approved',
      body: 'Your upload "{{title}}" has been approved and is now live!',
      html: '<h2>Upload Approved</h2><p>Your upload "<strong>{{title}}</strong>" has been approved and is now live!</p>',
      pushTitle: 'Upload Approved',
      pushBody: '{{title}} is now live!',
    });

    // Upload rejected
    this.registerTemplate('upload-rejected', {
      subject: 'Upload Review: {{title}}',
      body: 'Your upload "{{title}}" needs changes: {{reason}}',
      html: '<h2>Upload Review</h2><p>Your upload "<strong>{{title}}</strong>" needs changes:</p><p>{{reason}}</p>',
      pushTitle: 'Upload Review',
      pushBody: '{{title}} needs changes',
    });

    // Role changed
    this.registerTemplate('role-changed', {
      subject: 'Your Role Has Been Updated',
      body: 'Your role has been changed to {{role}}',
      html: '<h2>Role Updated</h2><p>Your role has been changed to <strong>{{role}}</strong></p>',
      pushTitle: 'Role Updated',
      pushBody: 'Your role is now {{role}}',
    });
  }

  /**
   * Replace template variables
   */
  private replaceVariables(text: string, data: Record<string, any>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }
}

// Export singleton instance
export const MMINotifications = new MMINotificationsClass();

