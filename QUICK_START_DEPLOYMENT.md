# Quick Start Deployment Guide 🚀

## You Are Here: Getting Your First Build! 📱

Follow these steps EXACTLY and you'll have CallWall running on your phone in ~30 minutes!

---

## Step 1: Install EAS CLI (2 minutes)

Open your terminal and run:

```bash
npm install -g eas-cli
```

Verify installation:
```bash
eas --version
# Should show: eas-cli/x.x.x
```

---

## Step 2: Create Expo Account (3 minutes)

If you DON'T have an Expo account:

```bash
eas register
```

Follow prompts to create account.

If you ALREADY have an Expo account:

```bash
eas login
```

Enter your credentials.

---

## Step 3: Configure Project (2 minutes)

```bash
cd /workspace/cmikwezhe000po6il09mbbzm5/Call

# Link project to your Expo account
eas init

# This will:
# - Create an Expo project
# - Update app.json with project ID
# - Link to your account
```

**IMPORTANT**: When prompted "Would you like to create a project?", say **YES**

---

## Step 4: Start iOS Preview Build (5 min work, 20 min build) 📱

```bash
eas build --platform ios --profile preview
```

**What happens**:
1. EAS asks for Apple credentials (optional for preview builds)
2. Uploads your code to EAS servers
3. Builds the app in the cloud
4. Gives you a QR code to install on iPhone

**To install on your iPhone**:
- Scan QR code with Camera app
- Or download from the URL provided
- Install via TestFlight or direct download

---

## Step 5: Start Android Preview Build (5 min work, 15 min build) 🤖

```bash
eas build --platform android --profile preview
```

**What happens**:
1. EAS generates/uses keystore automatically
2. Builds APK file
3. Gives you download link

**To install on Android**:
- Download APK from provided URL
- Enable "Install from Unknown Sources"
- Install the APK

---

## Step 6: While Builds Run - Set Up Supabase! 🗄️

Builds take 15-30 minutes, so let's use that time wisely!

### 6.1: Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Verify email if needed

### 6.2: Create New Project

1. Click "New Project"
2. Fill in:
   - **Name**: callwall-prod
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users (US East, EU West, etc.)
   - **Pricing Plan**: Free (for now)
3. Click "Create new project"
4. Wait ~2 minutes for project to initialize

### 6.3: Get Your Project Credentials

Once project is ready:

1. Go to **Settings** → **API**
2. Copy these values:

```bash
# Save these - you'll need them!
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (keep this SECRET!)
```

### 6.4: Update React Native App

In your terminal:

```bash
cd /workspace/cmikwezhe000po6il09mbbzm5/Call

# Create .env file
cat > .env << EOF
EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL_HERE
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
EOF
```

**Replace YOUR_SUPABASE_URL_HERE and YOUR_ANON_KEY_HERE with actual values!**

---

## Step 7: Run Database Schema (5 minutes)

1. In Supabase Dashboard, click **SQL Editor**
2. Click "New query"
3. Open this file: `/workspace/cmikwezhe000po6il09mbbzm5/Call/DATABASE_SCHEMA.md`
4. Copy ALL the SQL from the file
5. Paste into Supabase SQL Editor
6. Click "Run" (bottom right)
7. Wait for "Success" message

**Expected output**: ~15 tables created, RLS policies enabled

---

## Step 8: Install Supabase CLI (3 minutes)

```bash
# Install Supabase CLI
npm install -g supabase

# Verify installation
supabase --version

# Login to Supabase
supabase login
```

This opens browser for authentication.

---

## Step 9: Link Project to Supabase (2 minutes)

```bash
cd /workspace/cmikwezhe000po6il09mbbzm5/Call

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF
```

**Where to find project ref**:
- Supabase Dashboard → Settings → General → Reference ID

---

## Step 10: Configure Edge Function Secrets (10 minutes)

You need API keys for:
- OpenAI (https://platform.openai.com/api-keys)
- Anthropic (https://console.anthropic.com/settings/keys)
- Stripe (https://dashboard.stripe.com/apikeys)

```bash
# Set Supabase secrets
supabase secrets set SUPABASE_URL="https://xxxxx.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# OpenAI
supabase secrets set OPENAI_API_KEY="sk-..."

# Anthropic
supabase secrets set ANTHROPIC_API_KEY="sk-ant-..."

# Stripe
supabase secrets set STRIPE_SECRET_KEY="sk_test_..." # Use test key first!
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_..." # We'll get this after deployment

# Stripe Price IDs (create in Stripe Dashboard first)
supabase secrets set STRIPE_PREMIUM_MONTHLY_PRICE_ID="price_xxxxx"
supabase secrets set STRIPE_PREMIUM_ANNUAL_PRICE_ID="price_xxxxx"
supabase secrets set STRIPE_BUSINESS_MONTHLY_PRICE_ID="price_xxxxx"
supabase secrets set STRIPE_BUSINESS_ANNUAL_PRICE_ID="price_xxxxx"
```

**Verify secrets**:
```bash
supabase secrets list
```

---

## Step 11: Deploy Edge Functions (5 minutes)

```bash
cd /workspace/cmikwezhe000po6il09mbbzm5/Call

# Deploy all functions at once
supabase functions deploy transcribe-voicemail
supabase functions deploy generate-voice
supabase functions deploy analyze-threat
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

**Expected output**: "Deployed successfully" for each function

**Verify deployment**:
```bash
supabase functions list
```

You should see all 5 functions listed.

---

## Step 12: Test Edge Functions (5 minutes)

Let's test one function to make sure it works:

```bash
# Test the analyze-threat function
supabase functions invoke analyze-threat \
  --body '{"communicationText":"You need to pay this debt immediately or we will sue you!","userTier":"premium"}' \
  --method POST
```

**Expected response**: JSON with threat analysis

If you see an error, check:
- Secrets are configured correctly
- Function deployed successfully
- API keys are valid

---

## Step 13: Configure Stripe Webhook (5 minutes)

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Set endpoint URL to:
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events:
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
   - checkout.session.completed
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)
7. Update secret:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
   ```
8. Redeploy webhook function:
   ```bash
   supabase functions deploy stripe-webhook
   ```

---

## Step 14: Check Your Builds! 🎉

By now, your preview builds should be done!

### Check Build Status:

```bash
eas build:list
```

Or go to: https://expo.dev/accounts/YOUR_USERNAME/projects/callwall/builds

### Install on Device:

**iOS**:
- Open build URL on iPhone
- Install via TestFlight or direct download
- Open CallWall app!

**Android**:
- Download APK from build URL
- Install APK
- Open CallWall app!

---

## Step 15: Test the App! 🧪

1. **Create account** (register new user)
2. **Test legal documents**:
   - Go to Legal tab
   - Create Debt Validation letter
   - Fill form
   - Generate PDF
3. **Test voicemail** (requires actual backend):
   - Go to Voicemail tab
   - Record sample voicemail
   - Request transcription
4. **Test subscription**:
   - Go to Profile → Manage Subscription
   - View tier comparison

---

## Troubleshooting

### "Expo account not found"
```bash
eas whoami
# If not logged in:
eas login
```

### "Build failed"
```bash
# View logs
eas build:view

# Common fixes:
# - Check app.json is valid JSON
# - Ensure all dependencies in package.json
# - Clear cache and retry:
eas build --platform ios --profile preview --clear-cache
```

### "Edge Function deployment failed"
```bash
# Check logs
supabase functions logs function-name

# Verify secrets
supabase secrets list

# Redeploy with force
supabase functions deploy function-name --no-verify-jwt
```

### "Database error"
- Verify DATABASE_SCHEMA.md ran successfully
- Check RLS policies are enabled
- Verify Supabase URL and keys in .env

---

## What's Next?

Once everything works:

1. **Create production Stripe products** (switch from test to live keys)
2. **Create production assets** (app icons, screenshots)
3. **Build for production**: `eas build --platform all --profile production`
4. **Submit to stores**: Follow APP_STORE_SUBMISSION_GUIDE.md

---

## Need Help?

- **EAS Build Issues**: https://docs.expo.dev/build/introduction/
- **Supabase Issues**: https://supabase.com/docs
- **Edge Functions**: Check `supabase/EDGE_FUNCTIONS_GUIDE.md`
- **Submission**: Check `APP_STORE_SUBMISSION_GUIDE.md`

---

**YOU GOT THIS! 🚀**

Estimated total time: **1-2 hours** (most of it is waiting for builds)
