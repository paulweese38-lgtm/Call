# Support Email Setup Guide

Complete guide to setting up professional support and legal email addresses for CallWall.

---

## Required Email Addresses

For App Store and Play Store submission, you need these email addresses live and accessible:

### Essential (Required for Submission)
- **support@callwall.app** - Main customer support
- **privacy@callwall.app** - Privacy policy inquiries
- **legal@callwall.app** - Terms of Service and legal notices

### Recommended (Professional)
- **billing@callwall.app** - Billing and subscription inquiries
- **gdpr@callwall.app** - GDPR data requests (European users)
- **ccpa@callwall.app** - CCPA data requests (California users)
- **dpo@callwall.app** - Data Protection Officer contact
- **dmca@callwall.app** - Copyright infringement notices
- **refunds@callwall.app** - Refund requests
- **arbitration-opt-out@callwall.app** - Arbitration opt-out requests

### Optional (Future Growth)
- **info@callwall.app** - General information
- **press@callwall.app** - Media and press inquiries
- **partnerships@callwall.app** - Business partnerships
- **security@callwall.app** - Security vulnerability reports
- **feedback@callwall.app** - User feedback and feature requests

---

## Option 1: Custom Domain Email (Recommended)

**Best for**: Professional appearance, full control, email forwarding

### Step 1: Purchase Domain (if not already owned)

**Option A: Namecheap** (Recommended - affordable)
1. Visit namecheap.com
2. Search for "callwall.app"
3. Purchase domain (~$12/year for .app)
4. Enable privacy protection (usually free)

**Option B: Google Domains / Cloudflare** (Alternative)
- Google Domains: ~$12/year
- Cloudflare: At-cost pricing (~$10/year)

### Step 2: Set Up Email Hosting

**Option A: Google Workspace (Business Tier)** - $6/user/month
Best for: Professional teams, unlimited storage, integrated calendar/docs

1. Visit workspace.google.com
2. Sign up for "Business Starter" plan ($6/user/month)
3. Verify domain ownership
4. Add users: support@callwall.app, privacy@callwall.app, etc.

**Pros**:
- ✅ Professional Gmail interface
- ✅ Unlimited email aliases per user
- ✅ 30GB storage per user
- ✅ Google Calendar, Drive, Docs integration
- ✅ Mobile app support
- ✅ 99.9% uptime SLA

**Cons**:
- ❌ $6/month per user (can use aliases to reduce cost)

**Setup Cost**: $6/month (one user with multiple aliases)

---

**Option B: Zoho Mail (Free Tier or Paid)** - FREE or $1/user/month
Best for: Budget-conscious, basic email needs

**Free Plan** (Up to 5 users, 5GB/user):
1. Visit zoho.com/mail
2. Sign up for Free plan
3. Add custom domain (callwall.app)
4. Verify domain with DNS records
5. Create mailboxes: support@, privacy@, legal@

**Paid Plan** ($1/user/month - "Mail Lite"):
- 10GB storage per user
- No Zoho branding
- Email aliases

**Pros**:
- ✅ FREE for up to 5 users
- ✅ No ads
- ✅ Custom domain
- ✅ Mobile app support
- ✅ IMAP/POP3 support

**Cons**:
- ❌ Limited storage (5GB free tier)
- ❌ Basic features only
- ❌ Interface not as polished as Gmail

**Setup Cost**: FREE (or $1/month paid)

---

**Option C: ImprovMX (Email Forwarding)** - FREE
Best for: Forwarding all emails to personal Gmail

1. Visit improvmx.com
2. Add domain (callwall.app)
3. Set up DNS records (MX records)
4. Create email aliases:
   - support@callwall.app → your.personal@gmail.com
   - privacy@callwall.app → your.personal@gmail.com
   - legal@callwall.app → your.personal@gmail.com

5. Reply from custom email (ImprovMX supports SMTP replies)

**Pros**:
- ✅ Completely FREE
- ✅ Unlimited email aliases
- ✅ Unlimited forwarding
- ✅ Easy setup (5 minutes)
- ✅ Can reply from custom domain

**Cons**:
- ❌ No separate mailboxes (all go to one inbox)
- ❌ Must use SMTP settings to reply as custom domain
- ❌ No email storage (relies on personal email)

**Setup Cost**: FREE

---

### Step 3: Configure DNS Records

**For Google Workspace / Zoho Mail:**

Add these MX records to your domain DNS (provided by email host):

```
Type: MX
Priority: 1
Host: @
Value: [provided by email host]
TTL: 3600
```

**For ImprovMX (Free Forwarding):**

Add these MX records:

```
Type: MX
Priority: 10
Host: @
Value: mx1.improvmx.com
TTL: 3600

Type: MX
Priority: 20
Host: @
Value: mx2.improvmx.com
TTL: 3600
```

**DNS Propagation**: Takes 1-48 hours (usually 1-4 hours)

### Step 4: Test Email Delivery

1. Send test email to support@callwall.app
2. Verify you receive it
3. Reply to test email
4. Verify recipient receives reply from support@callwall.app

---

## Option 2: Temporary Email (For Testing Only)

**NOT recommended for production**, but useful for initial App Store submission if you're still setting up custom domain.

### Gmail Alias Method

1. Use your personal Gmail: yourname@gmail.com
2. Create filter rules to tag emails
3. Use Gmail's "Send mail as" feature

**Setup**:
1. Go to Gmail Settings → Accounts → "Send mail as"
2. Add: support@callwall.app (requires SMTP settings from email host)
3. For App Store submission, you can temporarily use: yourname+support@gmail.com

**⚠️ WARNING**: This looks unprofessional. Use only for testing or initial submission.

---

## Recommended Setup (Optimal)

**For Solo Developer / Bootstrap:**

**Use ImprovMX (FREE) + Personal Gmail:**
1. Set up callwall.app domain ($12/year)
2. Configure ImprovMX for email forwarding (FREE)
3. All emails forward to your personal Gmail
4. Reply using ImprovMX SMTP from custom domain

**Total Cost: $12/year** (domain only)

**Setup Time: 30 minutes**

---

**For Small Team / Professional:**

**Use Zoho Mail Free Tier:**
1. Set up callwall.app domain ($12/year)
2. Sign up for Zoho Mail Free (FREE for 5 users)
3. Create 3 mailboxes:
   - support@callwall.app (main support)
   - privacy@callwall.app (privacy/legal requests)
   - billing@callwall.app (billing inquiries)
4. Use email aliases for others (legal@, gdpr@, ccpa@ → privacy@)

**Total Cost: $12/year** (domain only)

**Setup Time: 1 hour**

---

**For Business / Scaling:**

**Use Google Workspace:**
1. Set up callwall.app domain ($12/year)
2. Sign up for Google Workspace Business Starter ($6/month)
3. Create one user: team@callwall.app
4. Add email aliases:
   - support@callwall.app
   - privacy@callwall.app
   - legal@callwall.app
   - billing@callwall.app
   - (all go to team@callwall.app)

**Total Cost: $84/year** ($12 domain + $72 Google Workspace)

**Setup Time: 1 hour**

---

## Email Response Templates

### Auto-Reply for Support Email

**Subject**: We've received your CallWall support request

```
Hi there,

Thanks for contacting CallWall support! We've received your message and will respond within 24 hours (usually much faster).

In the meantime, here are some helpful resources:

📚 Help Center: callwall.app/help
📖 Privacy Policy: callwall.app/privacy
📄 Terms of Service: callwall.app/terms
❓ FAQs: callwall.app/faq

For urgent issues, please include:
- Your account email
- Device type (iPhone/Android)
- App version
- Description of the issue
- Screenshots (if applicable)

We're here to help!

Best regards,
The CallWall Team

---
This is an automated response. A human will reply soon.
```

### Standard Support Response Template

**Subject**: Re: [Their Subject]

```
Hi [Name],

Thanks for reaching out to CallWall support!

[Answer their specific question]

[If bug/issue]:
I've escalated this to our engineering team. We'll investigate and release a fix in an upcoming update. I'll keep you posted on progress.

[If feature request]:
Great suggestion! I've added this to our feature request list. We prioritize features based on user demand, so we appreciate your feedback.

[If billing issue]:
I've reviewed your account and [resolution]. If you have any other billing questions, feel free to reply to this email.

Is there anything else I can help you with?

Best regards,
[Your Name]
CallWall Support Team
support@callwall.app
```

### Privacy Request Response Template (GDPR/CCPA)

**Subject**: Your CallWall Data Request

```
Hi [Name],

We've received your data request under [GDPR/CCPA].

**Your Rights:**
- Access: Request a copy of your data
- Rectification: Correct inaccurate data
- Erasure: Request deletion of your data
- Portability: Receive your data in machine-readable format

**To Process Your Request:**

Please reply to this email confirming:
1. Your full name
2. Email address registered with CallWall
3. Specific request (access, deletion, correction, or portability)
4. Proof of identity (for security purposes)

We'll process your request within 30 days as required by law.

If you have questions about our privacy practices, review our Privacy Policy: callwall.app/privacy

Best regards,
CallWall Privacy Team
privacy@callwall.app
```

### Refund Request Response Template

**Subject**: Your CallWall Refund Request

```
Hi [Name],

Thanks for contacting us about a refund.

**Our Refund Policy:**
- Monthly subscriptions: No refunds for partial months, but you can cancel anytime
- Annual subscriptions: Full refund within 30 days of purchase, pro-rated after 30 days

**Your Subscription:**
- Plan: [Premium/Business]
- Purchase Date: [Date]
- Next Billing Date: [Date]

[If eligible for refund]:
I've processed your refund of $[amount]. It will appear on your statement within 5-10 business days.

[If not eligible]:
Unfortunately, your subscription is past our 30-day refund window. However, I've canceled your subscription so you won't be charged again. You'll retain access until [end date].

If there was an issue with our service, I'd love to hear your feedback so we can improve: feedback@callwall.app

Best regards,
[Your Name]
CallWall Billing Team
billing@callwall.app
```

### Legal Notice Response Template

**Subject**: Re: Legal Notice - CallWall

```
Hi [Name],

Thank you for contacting CallWall's legal team. We've received your [DMCA notice / legal inquiry / terms question].

[For DMCA]:
We take intellectual property rights seriously. We've reviewed your notice and [action taken]. If you have additional information, please reply to this email.

[For Terms inquiry]:
Our Terms of Service are available at callwall.app/terms. [Answer specific question].

[For legal threat]:
We've forwarded your message to our legal counsel. They will respond within [timeframe].

For urgent legal matters, you may also contact us at:
CallWall Legal Team
[Your Business Address]
legal@callwall.app

Best regards,
CallWall Legal Team
```

---

## Email Management Best Practices

### Response Time Goals
- **Support**: Within 24 hours (aim for 2-4 hours)
- **Privacy/Legal**: Within 48 hours (or as required by law)
- **Billing**: Within 12 hours (money is important)
- **General inquiries**: Within 48 hours

### Email Folder Organization

Create these folders/labels:
- 🚨 **Urgent** - Bug reports, billing issues, legal threats
- 📧 **Support** - General support inquiries
- 💳 **Billing** - Subscription, refund, payment issues
- 🔒 **Privacy** - GDPR/CCPA requests, data deletion
- ⚖️ **Legal** - Terms questions, DMCA, legal notices
- 💡 **Feature Requests** - User suggestions
- ⭐ **Positive Feedback** - Happy users, testimonials
- 👎 **Complaints** - Negative feedback, issues

### Canned Responses

Set up canned responses (templates) in Gmail/Zoho for:
- "How do I cancel my subscription?"
- "How do I upgrade to Premium?"
- "How do I delete my account?"
- "Is CallWall legal advice?"
- "How accurate is AI transcription?"
- "What data do you collect?"

### Email Signature

```
[Your Name]
CallWall Support Team
support@callwall.app
callwall.app

Have a question? Visit our Help Center: callwall.app/help
```

---

## App Store Submission Requirements

### Apple App Store Connect

**Support URL** (Required):
```
https://callwall.app/support
```

OR if you don't have a website yet:
```
mailto:support@callwall.app
```

**Marketing URL** (Optional):
```
https://callwall.app
```

**Privacy Policy URL** (Required):
```
https://callwall.app/privacy
```

OR host on GitHub Pages:
```
https://[yourusername].github.io/Call/PRIVACY_POLICY
```

### Google Play Console

**Email Address** (Required):
```
support@callwall.app
```

**Website** (Optional):
```
https://callwall.app
```

**Privacy Policy URL** (Required):
```
https://callwall.app/privacy
```

---

## Temporary Solution: GitHub Pages for URLs

If you don't have callwall.app domain set up yet, you can host Privacy Policy and Terms of Service on GitHub Pages for FREE.

### Setup GitHub Pages (5 minutes)

1. Go to your GitHub repository: https://github.com/paulweese38-lgtm/Call
2. Go to Settings → Pages
3. Under "Source", select "main" branch
4. Select "/docs" folder (or root "/ (root)")
5. Click "Save"
6. Wait 1-2 minutes for deployment

**Your URLs will be:**
```
https://paulweese38-lgtm.github.io/Call/PRIVACY_POLICY
https://paulweese38-lgtm.github.io/Call/TERMS_OF_SERVICE
```

### Format Documents for Web

GitHub Pages renders .md files as HTML automatically. Your existing PRIVACY_POLICY.md and TERMS_OF_SERVICE.md will work perfectly!

**Optional: Add a simple index.html**

```html
<!DOCTYPE html>
<html>
<head>
  <title>CallWall - Legal Documents</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    h1 { color: #3B82F6; }
    a { color: #3B82F6; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>CallWall - Legal Documents</h1>
  <p>CallWall protects you from harassment and debt collection violations.</p>

  <h2>Legal Information</h2>
  <ul>
    <li><a href="PRIVACY_POLICY">Privacy Policy</a></li>
    <li><a href="TERMS_OF_SERVICE">Terms of Service</a></li>
  </ul>

  <h2>Contact</h2>
  <p>Email: <a href="mailto:support@callwall.app">support@callwall.app</a></p>
  <p>Privacy: <a href="mailto:privacy@callwall.app">privacy@callwall.app</a></p>
</body>
</html>
```

Save as `index.html` in your repository root.

---

## Email Service Comparison

| Service | Cost | Storage | Users | Aliases | Best For |
|---------|------|---------|-------|---------|----------|
| **ImprovMX** | FREE | N/A (forwarding) | Unlimited | Unlimited | Solo, forwarding only |
| **Zoho Mail Free** | FREE | 5GB/user | 5 | Limited | Solo/small team |
| **Zoho Mail Lite** | $1/user/month | 10GB/user | Unlimited | Yes | Growing team |
| **Google Workspace** | $6/user/month | 30GB/user | Unlimited | Unlimited | Professional/scaling |
| **Microsoft 365** | $6/user/month | 50GB/user | Unlimited | Unlimited | Enterprise |

---

## Quick Start Checklist

### For App Store Submission (Minimum Required)

- [ ] Purchase domain: callwall.app (~$12/year)
- [ ] Set up ImprovMX email forwarding (FREE)
- [ ] Create email aliases: support@, privacy@, legal@
- [ ] Test email delivery and replies
- [ ] Set up GitHub Pages for Privacy Policy and Terms URLs
- [ ] Add support URL to App Store Connect: mailto:support@callwall.app
- [ ] Add Privacy Policy URL: https://[yourusername].github.io/Call/PRIVACY_POLICY

**Total Time: 1 hour**
**Total Cost: $12/year**

### For Professional Setup

- [ ] Purchase domain: callwall.app
- [ ] Sign up for Zoho Mail Free or Google Workspace
- [ ] Create mailboxes: support@, privacy@, billing@
- [ ] Set up email aliases for other addresses
- [ ] Configure DNS records (MX records)
- [ ] Test email delivery and replies
- [ ] Set up auto-replies for common inquiries
- [ ] Create canned responses for FAQs
- [ ] Set up email forwarding to mobile device
- [ ] Add URLs to App Store Connect and Play Console

**Total Time: 2 hours**
**Total Cost: $12-84/year**

---

## Troubleshooting

### Email Not Receiving

**Check DNS Propagation:**
```
nslookup -type=MX callwall.app
```

Should show your MX records (ImprovMX, Google, or Zoho).

**Wait Time**: DNS changes take 1-48 hours to propagate (usually 1-4 hours).

**Tools to Check:**
- https://mxtoolbox.com/SuperTool.aspx
- https://dnschecker.org

### Email Goes to Spam

**Solutions:**
1. Add SPF record to DNS:
```
Type: TXT
Host: @
Value: v=spf1 include:_spf.improvmx.com ~all
(or as provided by your email host)
TTL: 3600
```

2. Add DKIM record (provided by email host)

3. Ask recipients to whitelist your domain

### Can't Reply from Custom Domain

**For ImprovMX:**
1. Go to ImprovMX dashboard
2. Find SMTP settings
3. Configure in Gmail:
   - Settings → Accounts → "Send mail as"
   - Add support@callwall.app
   - Use ImprovMX SMTP server

**For Google Workspace / Zoho:**
- Replies should work automatically from webmail or mobile app

---

## Next Steps After Email Setup

1. ✅ Test all email addresses (send and receive)
2. ✅ Set up auto-replies for high-volume addresses (support@)
3. ✅ Create folder/label organization
4. ✅ Add email URLs to App Store Connect
5. ✅ Add email URLs to Google Play Console
6. ✅ Update Privacy Policy and Terms with correct email addresses
7. ✅ Set up email forwarding to mobile device for urgent inquiries
8. ✅ Document email login credentials in password manager

---

**Recommendation for CallWall:**

Start with **ImprovMX (FREE)** + **GitHub Pages** for immediate App Store submission. Upgrade to **Zoho Mail** or **Google Workspace** when you have revenue.

**Total immediate cost: $12/year** (domain only)

---

**Last Updated**: December 1, 2025
**Status**: Ready for implementation

© 2025 CallWall. All rights reserved.
