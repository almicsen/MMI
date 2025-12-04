/**
 * Firebase Cloud Functions for MMI Notifications
 * 
 * This processes notifications from Firestore and sends them via email/push.
 * 
 * Setup:
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Login: firebase login
 * 3. Initialize: firebase init functions
 * 4. Install dependencies: cd functions && npm install
 * 5. Deploy: firebase deploy --only functions
 * 
 * Free Tier: Firebase Spark plan includes free Cloud Functions (with limits)
 * For email sending, you'll need an email service (SendGrid, Mailgun, etc. - all have free tiers)
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Process notifications when they're created
 * This function triggers automatically when a new notification is added to Firestore
 */
exports.processNotifications = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    const notificationId = context.params.notificationId;

    // Only process pending notifications
    if (notification.status !== 'pending') {
      console.log(`Notification ${notificationId} is not pending, skipping`);
      return null;
    }

    console.log(`Processing notification ${notificationId} for ${notification.to}`);

    try {
      // Process email notifications
      if (notification.type === 'email' || notification.type === 'both') {
        await sendEmail(notification);
        console.log(`Email sent for notification ${notificationId}`);
      }

      // Process push notifications
      if (notification.type === 'push' || notification.type === 'both') {
        await sendPushNotification(notification);
        console.log(`Push notification sent for ${notificationId}`);
      }

      // Mark as sent
      await snap.ref.update({
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Notification ${notificationId} marked as sent`);
      return null;
    } catch (error) {
      console.error(`Error processing notification ${notificationId}:`, error);
      
      // Mark as failed
      await snap.ref.update({
        status: 'failed',
        error: error.message || 'Unknown error',
      });

      return null;
    }
  });

/**
 * Send email notification
 * TODO: Integrate with email service (SendGrid, Mailgun, etc.)
 * 
 * Example with SendGrid:
 * const sgMail = require('@sendgrid/mail');
 * sgMail.setApiKey(process.env.SENDGRID_API_KEY);
 * await sgMail.send({
 *   to: notification.to,
 *   from: 'noreply@yourdomain.com',
 *   subject: notification.subject,
 *   text: notification.body,
 *   html: notification.html,
 * });
 */
async function sendEmail(notification) {
  // For now, just log (uncomment below when email service is configured)
  console.log(`Email notification for ${notification.to}:`, {
    subject: notification.subject,
    body: notification.body,
  });

  // Uncomment when you have SendGrid configured:
  // try {
  //   const sgMail = require('@sendgrid/mail');
  //   const apiKey = functions.config().sendgrid?.api_key || process.env.SENDGRID_API_KEY;
  //   if (!apiKey) {
  //     throw new Error('SendGrid API key not configured');
  //   }
  //   sgMail.setApiKey(apiKey);
  //   
  //   await sgMail.send({
  //     to: notification.to,
  //     from: functions.config().email?.from || 'noreply@mobilemediainteractions.com',
  //     subject: notification.subject,
  //     text: notification.body,
  //     html: notification.html || notification.body,
  //   });
  // } catch (error) {
  //   console.error('SendGrid error:', error);
  //   throw error;
  // }
}

/**
 * Send push notification via Firebase Cloud Messaging
 */
async function sendPushNotification(notification) {
  // TODO: Get FCM token from user document
  // For now, this is a placeholder
  console.log(`Would send push notification:`, {
    to: notification.to,
    title: notification.pushTitle,
    body: notification.pushBody,
  });

  // Example implementation (requires FCM tokens stored in user documents):
  // const userDoc = await admin.firestore().collection('users').doc(notification.to).get();
  // const fcmToken = userDoc.data()?.fcmToken;
  // if (fcmToken) {
  //   await admin.messaging().send({
  //     token: fcmToken,
  //     notification: {
  //       title: notification.pushTitle,
  //       body: notification.pushBody,
  //     },
  //   });
  // }
}

