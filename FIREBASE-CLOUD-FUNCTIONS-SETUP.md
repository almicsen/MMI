# Firebase Cloud Functions Setup Guide

## ✅ Free Tier Available!

Firebase Cloud Functions have a **free tier (Spark plan)** that includes:
- 2 million invocations/month (free)
- 400,000 GB-seconds compute time/month (free)
- 200,000 CPU-seconds/month (free)

**For email sending**, you'll need an email service, but they all have free tiers:
- **SendGrid**: 100 emails/day free
- **Mailgun**: 5,000 emails/month free (first 3 months)
- **Resend**: 3,000 emails/month free
- **AWS SES**: 62,000 emails/month free (if using AWS)

## Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase

```bash
firebase login
```

This will open your browser to authenticate.

## Step 3: Initialize Functions

```bash
cd /Users/almicsen/Documents/GitHub/MMI
firebase init functions
```

When prompted:
- **Language**: JavaScript (or TypeScript if you prefer)
- **ESLint**: Yes (recommended)
- **Install dependencies**: Yes

## Step 4: Install Dependencies

The `functions/package.json` is already set up. Just install:

```bash
cd functions
npm install
```

## Step 5: Set Up Email Service (Optional but Recommended)

### Option A: SendGrid (Recommended - Easiest)

1. **Sign up**: https://sendgrid.com (free tier: 100 emails/day)
2. **Get API Key**:
   - Go to Settings → API Keys
   - Create API Key
   - Copy the key
3. **Add to Firebase Functions config**:
   ```bash
   firebase functions:config:set sendgrid.api_key="YOUR_SENDGRID_API_KEY"
   firebase functions:config:set email.from="noreply@yourdomain.com"
   ```
4. **Install SendGrid SDK**:
   ```bash
   cd functions
   npm install @sendgrid/mail
   ```
5. **Update `functions/index.js`**:
   - Uncomment the SendGrid code
   - The function is already set up, just needs to be enabled

### Option B: Mailgun

1. **Sign up**: https://www.mailgun.com (free tier: 5,000 emails/month)
2. **Get API Key** from dashboard
3. **Add to Firebase Functions config**:
   ```bash
   firebase functions:config:set mailgun.api_key="YOUR_MAILGUN_API_KEY"
   firebase functions:config:set mailgun.domain="yourdomain.com"
   ```

### Option C: Resend (Modern, Simple)

1. **Sign up**: https://resend.com (free tier: 3,000 emails/month)
2. **Get API Key**
3. **Add to Firebase Functions config**:
   ```bash
   firebase functions:config:set resend.api_key="YOUR_RESEND_API_KEY"
   ```

## Step 6: Deploy Functions

```bash
cd /Users/almicsen/Documents/GitHub/MMI
firebase deploy --only functions
```

This will deploy the `processNotifications` function that automatically processes notifications.

## Step 7: Test

1. Go to Admin Dashboard → Notifications
2. Send a test notification
3. Check the notification status (should change from "pending" to "sent" within seconds)
4. Check Firebase Console → Functions → Logs for any errors

## How It Works

1. **Notification Created**: When you send a notification from the admin panel, it's created in Firestore with status "pending"
2. **Function Triggers**: The `processNotifications` Cloud Function automatically triggers
3. **Processing**: Function sends email/push notification
4. **Status Update**: Function updates notification status to "sent" or "failed"

## Monitoring

- **View Logs**: `firebase functions:log`
- **View in Console**: Firebase Console → Functions → Logs
- **View Metrics**: Firebase Console → Functions → Usage

## Troubleshooting

### Function Not Triggering
- Check Firebase Console → Functions to see if it's deployed
- Check Firestore rules allow function to read/write notifications

### Email Not Sending
- Verify email service API key is set correctly
- Check function logs for errors
- Verify "from" email is verified in your email service

### Notifications Stuck on Pending
- Check function logs for errors
- Verify function is deployed and active
- Check Firestore rules

## Cost

**Free Tier (Spark Plan)**:
- ✅ 2M invocations/month free
- ✅ 400K GB-seconds/month free
- ✅ 200K CPU-seconds/month free

**Paid (Blaze Plan)** - Pay as you go:
- $0.40 per million invocations
- $0.0000025 per GB-second
- Very affordable for small to medium usage

**Email Service**:
- SendGrid: 100 emails/day free
- Mailgun: 5,000 emails/month free
- Resend: 3,000 emails/month free

## Next Steps

1. ✅ Set up Firebase Functions (this guide)
2. ✅ Choose and configure email service
3. ✅ Deploy functions
4. ✅ Test notifications
5. ✅ Monitor usage

---

**Note**: The function is already set up in `functions/index.js`. You just need to:
1. Install Firebase CLI
2. Initialize functions
3. Configure email service (optional)
4. Deploy

The function will automatically process all new notifications!

