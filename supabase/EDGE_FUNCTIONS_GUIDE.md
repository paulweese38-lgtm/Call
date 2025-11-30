# Supabase Edge Functions Deployment Guide

## Overview

This guide covers deploying and configuring the CallWall Supabase Edge Functions for production use. These functions enable AI-powered features (OpenAI, Anthropic) and payment processing (Stripe) while keeping API keys secure on the backend.

## Prerequisites

1. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
2. **Supabase CLI**: Install the Supabase CLI
   ```bash
   npm install -g supabase
   ```
3. **API Keys**: Obtain keys for:
   - OpenAI API (for Whisper transcription and TTS)
   - Anthropic API (for Claude threat analysis)
   - Stripe (for payment processing)

## Edge Functions Overview

### 1. transcribe-voicemail
**Purpose**: Transcribes voicemail audio using OpenAI Whisper API
**Input**: `{ voicemailId: string, audioUrl: string }`
**Output**: `{ success: boolean, transcript?: string, error?: string }`
**Used by**: `voicemailService.ts`

### 2. generate-voice
**Purpose**: Generates AI voice using OpenAI TTS API
**Input**: `{ userId: string, inputText: string, voice: string, speed: number }`
**Output**: `{ success: boolean, audioUrl?: string, duration?: number, error?: string }`
**Used by**: `voiceService.ts`

### 3. analyze-threat
**Purpose**: Analyzes communication for threats using Anthropic Claude
**Input**: `{ communicationText: string, context?: object, userTier: string }`
**Output**: `{ success: boolean, analysis?: ThreatAnalysis, error?: string }`
**Used by**: `threatAnalysisService.ts`

### 4. create-checkout-session
**Purpose**: Creates Stripe checkout session for subscriptions
**Input**: `{ tier: string, billingPeriod: string, successUrl: string, cancelUrl: string }`
**Output**: `{ success: boolean, sessionId?: string, error?: string }`
**Used by**: `subscriptionService.ts`

### 5. stripe-webhook
**Purpose**: Handles Stripe webhook events for subscription updates
**Input**: Stripe webhook events (POST from Stripe)
**Output**: `{ received: true }`
**Used by**: Stripe automatically sends events here

## Step-by-Step Deployment

### Step 1: Link Your Supabase Project

```bash
cd /path/to/Call
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Find your project ref in Supabase Dashboard → Settings → General → Project ID

### Step 2: Set Environment Variables (Secrets)

Each Edge Function needs access to secrets. Set them using the Supabase CLI:

```bash
# Supabase keys (required by all functions)
supabase secrets set SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"

# OpenAI API key (for transcribe-voicemail and generate-voice)
supabase secrets set OPENAI_API_KEY="sk-your_openai_api_key_here"

# Anthropic API key (for analyze-threat)
supabase secrets set ANTHROPIC_API_KEY="sk-ant-your_anthropic_api_key_here"

# Stripe keys (for create-checkout-session and stripe-webhook)
supabase secrets set STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key"
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Stripe Price IDs (create these in Stripe Dashboard → Products)
supabase secrets set STRIPE_PREMIUM_MONTHLY_PRICE_ID="price_premium_monthly"
supabase secrets set STRIPE_PREMIUM_ANNUAL_PRICE_ID="price_premium_annual"
supabase secrets set STRIPE_BUSINESS_MONTHLY_PRICE_ID="price_business_monthly"
supabase secrets set STRIPE_BUSINESS_ANNUAL_PRICE_ID="price_business_annual"
```

**Where to find these keys:**
- **SUPABASE_URL**: Dashboard → Settings → API → Project URL
- **SUPABASE_SERVICE_ROLE_KEY**: Dashboard → Settings → API → service_role key
- **OPENAI_API_KEY**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **ANTHROPIC_API_KEY**: [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
- **STRIPE_SECRET_KEY**: [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
- **STRIPE_WEBHOOK_SECRET**: Create webhook endpoint (see Step 4)

### Step 3: Deploy Edge Functions

Deploy all functions at once:

```bash
supabase functions deploy transcribe-voicemail
supabase functions deploy generate-voice
supabase functions deploy analyze-threat
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

Or deploy all in one command:

```bash
supabase functions deploy
```

**Verify deployment:**
```bash
supabase functions list
```

You should see all 5 functions listed.

### Step 4: Configure Stripe Webhook

After deploying the `stripe-webhook` function, configure Stripe to send events to it:

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL to:
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Set it as a secret:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_your_secret_here"
   ```
7. Redeploy the webhook function:
   ```bash
   supabase functions deploy stripe-webhook
   ```

### Step 5: Test Edge Functions

Test each function using the Supabase CLI:

**Test transcribe-voicemail:**
```bash
supabase functions invoke transcribe-voicemail \
  --body '{"voicemailId":"test-id","audioUrl":"https://example.com/test.mp3"}' \
  --method POST
```

**Test generate-voice:**
```bash
supabase functions invoke generate-voice \
  --body '{"userId":"test-user","inputText":"Hello world","voice":"alloy","speed":1.0}' \
  --method POST
```

**Test analyze-threat:**
```bash
supabase functions invoke analyze-threat \
  --body '{"communicationText":"Test message","userTier":"premium"}' \
  --method POST
```

### Step 6: Update React Native App Configuration

Update your React Native app's `.env` file to point to your Supabase project:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

## Monitoring and Debugging

### View Function Logs

```bash
supabase functions logs transcribe-voicemail
supabase functions logs generate-voice
supabase functions logs analyze-threat
supabase functions logs create-checkout-session
supabase functions logs stripe-webhook
```

Or view all logs:
```bash
supabase functions logs
```

### Common Issues

**Issue: "OPENAI_API_KEY not configured"**
- Solution: Set the secret using `supabase secrets set OPENAI_API_KEY="your_key"`
- Verify: `supabase secrets list`

**Issue: "Invalid authentication token"**
- Solution: Ensure the React Native app is passing the JWT token in the Authorization header
- Check: `supabase.auth.getSession()` in the service file

**Issue: "Stripe webhook signature verification failed"**
- Solution: Verify the webhook secret is correct
- Make sure you're using the secret for the specific endpoint (not a different one)

**Issue: "Failed to download audio file"**
- Solution: Ensure Supabase Storage bucket policies allow public access to audio files
- Check: Supabase Dashboard → Storage → Policies

## Cost Considerations

### OpenAI Costs
- **Whisper API**: ~$0.006 per minute of audio
- **TTS API**: ~$15.00 per 1M characters (HD model)

### Anthropic Costs
- **Claude 3.5 Sonnet**: ~$3.00 per 1M input tokens, ~$15.00 per 1M output tokens
- Average threat analysis: ~500 input tokens, ~200 output tokens = $0.004 per analysis

### Stripe Costs
- **2.9% + $0.30** per successful card charge
- No additional fees for webhooks or API calls

### Supabase Costs
- **Edge Functions**: 500K requests/month (Free tier), then $2 per 1M requests
- **Storage**: 1GB free, then $0.021 per GB
- **Database**: 500MB free, then $0.125 per GB

**Recommendations:**
- Monitor usage in Supabase Dashboard → Usage
- Set up billing alerts in Stripe and OpenAI dashboards
- Implement rate limiting for high-volume users
- Cache frequently accessed data

## Production Checklist

- [ ] All Edge Functions deployed successfully
- [ ] All environment secrets configured
- [ ] Stripe webhook endpoint created and verified
- [ ] Stripe Price IDs created for Premium and Business tiers
- [ ] Test all functions with real API keys
- [ ] Monitor logs for errors
- [ ] Set up billing alerts for OpenAI, Anthropic, and Stripe
- [ ] Configure CORS if needed (Edge Functions use wildcard by default)
- [ ] Test subscription flow end-to-end
- [ ] Test voicemail transcription with real audio
- [ ] Test voice generation with various personalities
- [ ] Test threat analysis with different communication types
- [ ] Verify RLS policies are enabled on all database tables
- [ ] Review and adjust rate limits based on tier

## Updating Functions

When you make changes to an Edge Function:

```bash
# Edit the function code
# Then redeploy
supabase functions deploy function-name

# Or redeploy all
supabase functions deploy
```

## Rollback

If a deployment causes issues:

```bash
# View deployment history
supabase functions list

# Rollback to previous version (if supported)
# Or quickly fix and redeploy
supabase functions deploy function-name
```

## Security Best Practices

1. **Never expose service role key**: Only use in Edge Functions, never in React Native code
2. **Use RLS policies**: Enable Row Level Security on all database tables
3. **Validate inputs**: All Edge Functions validate user authentication and inputs
4. **Rate limiting**: Implement in Edge Functions or use Supabase API rate limiting
5. **Monitor logs**: Regularly check for suspicious activity
6. **Rotate secrets**: Periodically rotate API keys and update secrets
7. **Use HTTPS only**: All Edge Function URLs use HTTPS by default

## Support

- **Supabase Docs**: [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)
- **OpenAI API Reference**: [platform.openai.com/docs](https://platform.openai.com/docs)
- **Anthropic API Reference**: [docs.anthropic.com](https://docs.anthropic.com)
- **Stripe API Reference**: [stripe.com/docs/api](https://stripe.com/docs/api)

---

**Last Updated**: 2025-11-30
**Status**: Production Ready
