# App Store Submission Guide

## Overview

This guide covers the complete process for submitting CallWall to the Apple App Store and Google Play Store.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Build Configuration](#build-configuration)
3. [Apple App Store Submission](#apple-app-store-submission)
4. [Google Play Store Submission](#google-play-store-submission)
5. [Post-Submission](#post-submission)
6. [Common Issues](#common-issues)

---

## Prerequisites

### Accounts

**Apple Developer**:
- [ ] Enrolled in Apple Developer Program ($99/year)
- [ ] Team Agent or Admin role
- [ ] App Store Connect access

**Google Play**:
- [ ] Google Play Console account ($25 one-time fee)
- [ ] Developer account verified

### Expo Account

```bash
# Create Expo account (if not already)
npx expo register

# Login
npx expo login
```

### EAS (Expo Application Services)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to EAS
eas login

# Initialize EAS in project
cd Call
eas build:configure
```

This creates `eas.json`:
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## Build Configuration

### Step 1: Update app.json

Ensure all metadata is complete:

```json
{
  "expo": {
    "name": "CallWall",
    "slug": "callwall",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.callwall.mobile",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.callwall.mobile",
      "versionCode": 1
    }
  }
}
```

### Step 2: Create App Store Listings

**Apple App Store Connect**:
1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - **Platform**: iOS
   - **Name**: CallWall
   - **Primary Language**: English (US)
   - **Bundle ID**: com.callwall.mobile (must match app.json)
   - **SKU**: callwall-ios-1 (unique identifier)

**Google Play Console**:
1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - **App name**: CallWall
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free (with in-app purchases)
   - **Declarations**: Complete all required declarations

### Step 3: Build Production Apps

**iOS Build**:
```bash
# Create production iOS build
eas build --platform ios --profile production

# This will:
# 1. Prompt for Apple credentials (App Store Connect API key)
# 2. Register bundle identifier
# 3. Create provisioning profile
# 4. Build and sign the app
# 5. Upload to EAS servers

# Wait for build to complete (15-30 minutes)
```

**Android Build**:
```bash
# Create production Android build
eas build --platform android --profile production

# This will:
# 1. Generate or use existing keystore
# 2. Build AAB (Android App Bundle)
# 3. Sign the app
# 4. Upload to EAS servers

# Wait for build to complete (10-20 minutes)
```

**Build Outputs**:
- **iOS**: `.ipa` file (can download from EAS or submit directly)
- **Android**: `.aab` file (Android App Bundle)

---

## Apple App Store Submission

### Step 1: App Information

In App Store Connect, fill out:

**App Information**:
- **Name**: CallWall
- **Subtitle** (30 chars): "Protection from harassment"
- **Category**:
  - Primary: Productivity
  - Secondary: Utilities
- **Content Rights**: Check if using third-party content
- **Age Rating**: Complete questionnaire
  - Realistic Violence: None
  - Profanity: None
  - Medical Treatment: None
  - etc.

**Pricing and Availability**:
- **Price**: Free
- **Availability**: All countries (or select specific ones)
- **Pre-order**: No (for version 1.0.0)

### Step 2: App Store Listing

**App Preview and Screenshots**:
- Upload screenshots for each device size
- Add app preview videos (optional but recommended)

**Promotional Text** (170 chars):
```
Protect yourself from harassment and debt collection calls. Generate FDCPA-compliant legal documents, transcribe voicemails with AI, and detect threats automatically.
```

**Description**:
```
CallWall is your comprehensive protection against harassment, unwanted calls, and debt collection violations.

KEY FEATURES:

🛡️ Legal Protection Tools
• Generate debt validation letters
• Create cease and desist documents
• FDCPA-compliant templates
• One-tap PDF generation and sharing

🎙️ Voicemail Intelligence
• Automatic transcription with AI
• Threat level detection
• Sentiment analysis
• Auto-categorization (Personal/Business/Legal/Spam)

📱 Phone Management
• Track and block numbers
• Call history and analytics
• Pattern detection
• Advanced filtering

🤖 AI Voice Playground
• 6 unique voice personalities
• High-quality text-to-speech
• Custom voice settings
• Generation history

SUBSCRIPTION TIERS:

Free: 2 legal documents/month, 10 voicemail transcriptions
Premium ($9.99/month): Unlimited documents, 100 transcriptions, advanced AI
Business ($29.99/month): Everything + team features, API access, compliance monitoring

PRIVACY & SECURITY:
• End-to-end encryption
• Local biometric authentication
• No data selling or sharing
• GDPR and CCPA compliant

Perfect for:
• Individuals dealing with debt collectors
• People experiencing harassment
• Small businesses managing communications
• Anyone needing legal documentation quickly

Download CallWall today and take control of your communications.
```

**Keywords** (100 chars max):
```
debt,harassment,legal,voicemail,transcribe,block,FDCPA,cease desist,validation,call protection
```

**Support URL**: https://callwall.app/support (or your website)
**Marketing URL**: https://callwall.app (optional)
**Privacy Policy URL**: https://callwall.app/privacy (REQUIRED)

### Step 3: Version Information

**What's New in This Version**:
```
Welcome to CallWall 1.0! 🎉

• Complete legal protection toolkit
• AI-powered voicemail transcription
• Advanced threat detection
• Phone number management
• AI voice generation playground
• Subscription tiers for all needs

Get started protecting yourself today!
```

**Build**: Select the build uploaded via EAS

**App Review Information**:
- **Sign-in required**: Yes
- **Demo account**:
  - Username: demo@callwall.app
  - Password: Demo123! (create this account in production)
- **Contact Information**: Your email and phone
- **Notes**:
  ```
  Test account credentials provided above. All features require authentication.

  To test legal documents: Navigate to Legal tab → Select document type → Fill form → Generate PDF
  To test voicemail: Navigate to Voicemail tab → Record or upload audio → Transcribe
  To test subscriptions: Navigate to Profile → Manage Subscription (Stripe test mode)

  API keys are configured for production. All features should work end-to-end.
  ```

**App Review Attachments**: Upload any necessary documents (optional)

### Step 4: Age Rating

Complete the questionnaire honestly:
- Realistic Violence: None
- Cartoon or Fantasy Violence: None
- Sexual Content or Nudity: None
- Profanity or Crude Humor: None
- Horror or Fear Themes: None
- Mature or Suggestive Themes: None
- Medical/Treatment Information: None
- Alcohol, Tobacco, or Drug Use: None
- Simulated Gambling: None
- Contests, Sweepstakes, Lotteries, Raffles: None
- Unrestricted Web Access: No
- Gambling: No

**Expected Rating**: 4+ (for all ages)

### Step 5: App Privacy

In App Store Connect → App Privacy:

**Data Collection**:
- Contact Info: Email, Phone Number (collected for account)
- User Content: Audio recordings, User-generated content (voicemails, documents)
- Usage Data: Product Interaction (for analytics)

**Data Use**:
- App Functionality
- Analytics
- Product Personalization
- Customer Support

**Data Retention**: Specify your policy (e.g., "Data deleted when user deletes account")

**Third-Party Partners**:
- OpenAI (audio transcription)
- Anthropic (threat analysis)
- Stripe (payment processing)
- Supabase (backend infrastructure)

### Step 6: Submit for Review

1. In App Store Connect, go to your app version
2. Click "Add for Review"
3. Review all information
4. Click "Submit to App Review"
5. Wait for review (typically 24-48 hours)

**Review Process**:
- **In Review**: Apple is testing your app
- **Pending Developer Release**: Approved, waiting for your release
- **Ready for Sale**: Live on App Store!
- **Rejected**: Check rejection reasons, fix, and resubmit

---

## Google Play Store Submission

### Step 1: Store Listing

In Play Console → Your app → Store presence → Main store listing:

**App details**:
- **App name**: CallWall
- **Short description** (80 chars):
  ```
  Protect yourself from harassment with legal tools, AI transcription & threat detection
  ```

- **Full description** (4000 chars):
  ```
  [Same as iOS description above, formatted for Google Play]
  ```

**Graphics**:
- Icon: 512x512px (already in Play Console from first upload)
- Feature graphic: 1024x500px
- Phone screenshots: At least 2 (1080x1920px or higher)
- Tablet screenshots: Optional but recommended

**Categorization**:
- **App category**: Productivity
- **Tags**: Legal, Communication, Business, Tools

**Contact details**:
- **Website**: https://callwall.app
- **Email**: support@callwall.app
- **Phone**: Your phone number
- **Privacy policy**: https://callwall.app/privacy (REQUIRED)

### Step 2: Content Rating

Complete the IARC questionnaire:
- Category: Utility, Productivity, Communication
- Interactive elements: Users Interact, Shares Info
- Answer questions about content (similar to iOS age rating)

**Expected Rating**: Everyone or Teen

### Step 3: App Content

**Privacy policy**: Provide URL (required)

**Ads**: Does your app contain ads? No

**Target audience and content**:
- **Target age group**: 18 and over (legal tools)
- **Store listing**: General audience

**Data safety**:
Fill out detailed data collection and sharing information:
- What data is collected
- How it's used
- Whether it's shared with third parties
- Security practices

**App access**: Does your app have restricted access? No

**Government apps**: Is this a government app? No

**Monetization**: Free with in-app purchases

### Step 4: In-app Products

Set up subscription offerings:

**Premium Monthly** ($9.99/month):
- Product ID: `premium_monthly`
- Title: "Premium Subscription - Monthly"
- Description: "Unlimited legal documents, 100 voicemail transcriptions, advanced AI threat analysis, all voice personalities, priority support"

**Premium Annual** ($99/year):
- Product ID: `premium_annual`
- Title: "Premium Subscription - Annual"
- Description: "Annual subscription - Save $20! All Premium features for 12 months"

**Business Monthly** ($29.99/month):
- Product ID: `business_monthly`
- Title: "Business Subscription - Monthly"
- Description: "Everything in Premium + multi-user access, API access, custom branding, compliance monitoring, priority support"

**Business Annual** ($299/year):
- Product ID: `business_annual`
- Title: "Business Subscription - Annual"
- Description: "Annual subscription - Save $60! All Business features for 12 months"

### Step 5: Production Track

1. Go to Release → Production
2. Click "Create new release"
3. Upload AAB file (from EAS build)
4. **Release name**: 1.0.0 (1)
5. **Release notes**:
   ```
   Welcome to CallWall 1.0!

   NEW:
   • Complete legal protection toolkit
   • AI-powered voicemail transcription
   • Advanced threat detection
   • Phone number management
   • AI voice generation playground
   • Subscription tiers for all needs

   Get started protecting yourself today!
   ```

6. Review and rollout percentage: 100%
7. Click "Review release"

### Step 6: Submit for Review

1. Review all information
2. Click "Start rollout to Production"
3. Confirm submission
4. Wait for review (typically 1-3 days)

**Review Status**:
- **In review**: Google is testing your app
- **Pending publication**: Approved, will go live shortly
- **Published**: Live on Google Play!

---

## Post-Submission

### Monitor Reviews

**iOS**:
- App Store Connect → My Apps → CallWall → Ratings and Reviews
- Respond to reviews (increases engagement)

**Android**:
- Play Console → CallWall → Reviews
- Reply to reviews directly

### Track Analytics

**iOS**:
- App Store Connect → Analytics
- Track downloads, crashes, sessions

**Android**:
- Play Console → Statistics
- Track installs, crashes, ANRs

**Firebase Analytics** (optional):
```bash
expo install @react-native-firebase/app @react-native-firebase/analytics
```

### Update Cycle

**Version Numbering**:
- **Major**: 1.0.0 → 2.0.0 (breaking changes, major features)
- **Minor**: 1.0.0 → 1.1.0 (new features, non-breaking)
- **Patch**: 1.0.0 → 1.0.1 (bug fixes, small improvements)

**iOS Build Numbers**:
- Increment for each submission: 1, 2, 3, etc.
- In app.json: `"buildNumber": "2"`

**Android Version Codes**:
- Increment for each submission: 1, 2, 3, etc.
- In app.json: `"versionCode": 2`

**Update Process**:
```bash
# 1. Update version in app.json
# 2. Build new version
eas build --platform all --profile production

# 3. Submit update
eas submit --platform ios
eas submit --platform android
```

---

## Common Issues

### iOS Rejection Reasons

**1. Demo Account Doesn't Work**
- Solution: Test demo account thoroughly before submission
- Provide working credentials in App Review Information

**2. Missing Privacy Policy**
- Solution: Host privacy policy on website, add URL to app.json and App Store Connect

**3. 2.3.10 - Accurate Metadata**
- Issue: App description doesn't match functionality
- Solution: Ensure screenshots and description accurately represent app

**4. 4.0 - Design**
- Issue: App crashes or has UI bugs
- Solution: Test on real devices, fix all crashes before submission

**5. 5.1.1 - Privacy**
- Issue: Insufficient data collection disclosure
- Solution: Complete App Privacy section thoroughly, explain all data usage

### Android Rejection Reasons

**1. Policy Violations**
- Issue: Missing content rating or privacy policy
- Solution: Complete all required sections in Play Console

**2. Crashes on Launch**
- Issue: App crashes immediately on certain devices
- Solution: Test on various Android versions (8.0 - 14), fix crashes

**3. Misleading Store Listing**
- Issue: Screenshots or description don't match app
- Solution: Use actual app screenshots, accurate descriptions

**4. Data Safety Issues**
- Issue: Incomplete or inaccurate data safety information
- Solution: Provide detailed, accurate data collection information

**5. APK/AAB Issues**
- Issue: Missing permissions or incorrect signatures
- Solution: Ensure all required permissions in app.json, verify keystore

### Build Issues

**Expo Build Failures**:
```bash
# Clear cache and rebuild
eas build:configure
eas build --platform ios --profile production --clear-cache
```

**iOS Certificate Issues**:
- Ensure you have Developer account access
- Let EAS manage certificates automatically
- Or manually create in Apple Developer Portal

**Android Keystore Issues**:
- EAS auto-generates keystore on first build
- Store keystore credentials securely (EAS handles this)
- Never lose keystore (can't update app without it)

---

## Submission Checklist

### Pre-Submission:
- [ ] All assets created (icons, screenshots, videos)
- [ ] Privacy policy hosted and URL added
- [ ] Terms of service created (if needed)
- [ ] Support email/website set up
- [ ] Demo account created and tested
- [ ] App tested on real devices
- [ ] All features working in production
- [ ] Edge Functions deployed and configured
- [ ] Stripe configured with real API keys
- [ ] Database migrations run in production
- [ ] All third-party integrations tested

### iOS Submission:
- [ ] Apple Developer account enrolled
- [ ] App created in App Store Connect
- [ ] Bundle ID matches app.json
- [ ] Production build created with EAS
- [ ] All store listing information filled
- [ ] Screenshots uploaded (all required sizes)
- [ ] App privacy completed
- [ ] Age rating completed
- [ ] Demo account provided
- [ ] Submitted for review

### Android Submission:
- [ ] Google Play Console account created
- [ ] App created in Play Console
- [ ] Package name matches app.json
- [ ] Production AAB created with EAS
- [ ] All store listing information filled
- [ ] Screenshots uploaded
- [ ] Feature graphic uploaded
- [ ] Content rating completed
- [ ] Data safety completed
- [ ] In-app products created
- [ ] Release rolled out to production

### Post-Submission:
- [ ] Monitor review status daily
- [ ] Respond to reviewer questions promptly
- [ ] Test app after approval
- [ ] Monitor crash reports
- [ ] Set up analytics tracking
- [ ] Respond to user reviews
- [ ] Plan version 1.1.0 updates

---

**Timeline Expectations**:
- iOS Review: 24-48 hours (typically)
- Android Review: 1-3 days (typically)
- First submission may take longer
- Updates review faster than initial submission

**Support Resources**:
- **App Store Connect Help**: https://developer.apple.com/support/app-store-connect/
- **Play Console Help**: https://support.google.com/googleplay/android-developer
- **Expo Docs**: https://docs.expo.dev/eas/

---

**Last Updated**: 2025-11-30
**Status**: Ready for submission
