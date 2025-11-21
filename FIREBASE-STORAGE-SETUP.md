# Firebase Storage Setup - Billing Plan Guide

## Understanding Firebase Storage Requirements

Firebase Storage requires the **Blaze (pay-as-you-go) plan**, but don't worry - it includes a generous **free tier** that should be more than enough for your project.

## Free Tier Limits (Blaze Plan)

The Blaze plan includes these free quotas every month:
- **Storage**: 5 GB
- **Downloads**: 1 GB/day
- **Uploads**: 20,000 operations/day
- **Deletes**: 20,000 operations/day

**For a project with ~10 users, you'll likely stay well within these free limits!**

## How to Enable Billing (Required for Storage)

### Step 1: Enable Billing
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **mobilemediainteractions-912cd**
3. Click the **gear icon (⚙️)** next to "Project Overview"
4. Select **"Usage and billing"**
5. Click **"Modify plan"** or **"Upgrade"**
6. Select **"Blaze plan"** (pay-as-you-go)
7. Click **"Continue"**

### Step 2: Add Payment Method
1. You'll be prompted to add a payment method
2. Add a credit card (required, but you won't be charged unless you exceed free limits)
3. Complete the billing setup

### Step 3: Set Up Budget Alerts (Recommended)
1. In Firebase Console, go to **Usage and billing**
2. Set up budget alerts to notify you if you approach free limits
3. Set alert at $1 or $5 to be safe

### Step 4: Enable Storage
1. Go to **Storage** in Firebase Console
2. Click **"Get started"**
3. Select **"Start in production mode"**
4. Choose the same location as your Firestore database
5. Click **"Done"**

## Important Notes

### You Won't Be Charged If:
- You stay within the free tier limits (5GB storage, 1GB/day downloads)
- For ~10 users, you'll likely use less than 1GB total storage
- Even with trailers and thumbnails, you should be fine

### You Will Be Charged If:
- You exceed 5GB of storage (charged per GB after that)
- You exceed 1GB/day downloads (charged per GB after that)
- But for a small project, this is very unlikely

## Cost Estimate for Your Project

With ~10 users:
- **Storage**: Videos, thumbnails, trailers - likely < 500MB total
- **Downloads**: Even with 100 views/day, you'd need 10MB videos to hit 1GB/day
- **Estimated monthly cost**: $0 (staying within free tier)

## Alternative: Use External Storage (If You Prefer)

If you don't want to enable billing, you can use external storage services:

### Option 1: Cloudinary (Free Tier)
- 25GB storage
- 25GB bandwidth/month
- Free for small projects
- Easy to integrate

### Option 2: AWS S3 (Free Tier)
- 5GB storage
- 20,000 GET requests/month
- Free for 12 months, then pay-as-you-go

### Option 3: YouTube/Vimeo (For Videos)
- Upload videos to YouTube/Vimeo
- Embed in your site
- Completely free
- Good for trailers and full content

## Recommendation

**For your project size (~10 users), I recommend enabling the Blaze plan:**
- You'll stay within free limits
- No cost for your use case
- Integrated with Firebase (easier setup)
- Better performance
- No need for external services

## Next Steps

1. **Enable Blaze plan** (add payment method)
2. **Set up budget alerts** (just to be safe)
3. **Enable Storage** in Firebase Console
4. **Copy storage rules** from `storage.rules` file
5. **Publish rules**

## Monitoring Usage

After setup, you can monitor your usage:
1. Go to **Usage and billing** in Firebase Console
2. Check **Storage** tab
3. See your current usage vs. free tier limits
4. Set up alerts if needed

## Troubleshooting

**"Billing account required" error:**
- Make sure you've completed the billing setup
- Wait a few minutes for it to activate
- Try refreshing the page

**Still can't enable Storage:**
- Check that billing is fully set up
- Verify payment method is active
- Contact Firebase support if issues persist

---

**Bottom line**: Enable the Blaze plan, add a payment method, and you'll be fine. With ~10 users, you'll stay well within the free tier and won't be charged anything.

