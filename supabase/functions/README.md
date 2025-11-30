# CallWall Supabase Edge Functions

## Overview

This directory contains Supabase Edge Functions that handle backend operations for the CallWall mobile app. These functions keep sensitive API keys secure and provide serverless endpoints for AI services and payment processing.

## Functions

### 1. transcribe-voicemail
Transcribes voicemail audio using OpenAI Whisper API.

**Endpoint**: `/functions/v1/transcribe-voicemail`
**Method**: POST
**Auth**: Required (JWT token)
**Input**:
```json
{
  "voicemailId": "uuid",
  "audioUrl": "https://..."
}
```
**Output**:
```json
{
  "success": true,
  "transcript": "Transcribed text here"
}
```

### 2. generate-voice
Generates AI voice using OpenAI TTS API.

**Endpoint**: `/functions/v1/generate-voice`
**Method**: POST
**Auth**: Required (JWT token)
**Input**:
```json
{
  "userId": "uuid",
  "inputText": "Text to convert to speech",
  "voice": "alloy|echo|fable|onyx|nova|shimmer",
  "speed": 1.0
}
```
**Output**:
```json
{
  "success": true,
  "audioUrl": "https://...",
  "duration": 15
}
```

### 3. analyze-threat
Analyzes communication for threats using Anthropic Claude API.

**Endpoint**: `/functions/v1/analyze-threat`
**Method**: POST
**Auth**: Required (JWT token)
**Input**:
```json
{
  "communicationText": "Text to analyze",
  "context": {
    "callerNumber": "+1234567890",
    "callTime": "2025-01-01T12:00:00Z"
  },
  "userTier": "free|premium|business"
}
```
**Output**:
```json
{
  "success": true,
  "analysis": {
    "threatLevel": "none|low|medium|high|critical",
    "sentimentScore": 0.5,
    "fdcpaViolations": ["..."],
    "harassmentIndicators": ["..."],
    "recommendedActions": ["..."],
    "confidence": 0.9,
    "reasoning": "..."
  }
}
```

### 4. create-checkout-session
Creates Stripe checkout session for subscriptions.

**Endpoint**: `/functions/v1/create-checkout-session`
**Method**: POST
**Auth**: Required (JWT token)
**Input**:
```json
{
  "tier": "premium|business",
  "billingPeriod": "monthly|annual",
  "successUrl": "app://success",
  "cancelUrl": "app://cancel"
}
```
**Output**:
```json
{
  "success": true,
  "sessionId": "cs_..."
}
```

### 5. stripe-webhook
Handles Stripe webhook events for subscription lifecycle.

**Endpoint**: `/functions/v1/stripe-webhook`
**Method**: POST
**Auth**: Stripe signature verification
**Input**: Stripe webhook event payload
**Output**:
```json
{
  "received": true
}
```

**Handled Events**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `checkout.session.completed`

## Shared Resources

### _shared/cors.ts
Common CORS headers used by all functions:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`

## Environment Variables (Secrets)

All functions require these secrets to be set in Supabase:

```bash
# Supabase (all functions)
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY

# OpenAI (transcribe-voicemail, generate-voice)
OPENAI_API_KEY

# Anthropic (analyze-threat)
ANTHROPIC_API_KEY

# Stripe (create-checkout-session, stripe-webhook)
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PREMIUM_MONTHLY_PRICE_ID
STRIPE_PREMIUM_ANNUAL_PRICE_ID
STRIPE_BUSINESS_MONTHLY_PRICE_ID
STRIPE_BUSINESS_ANNUAL_PRICE_ID
```

## Deployment

See [EDGE_FUNCTIONS_GUIDE.md](../EDGE_FUNCTIONS_GUIDE.md) for complete deployment instructions.

**Quick Deploy**:
```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy transcribe-voicemail
supabase functions deploy generate-voice
supabase functions deploy analyze-threat
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

## Testing

**Local Testing** (requires Supabase CLI):
```bash
# Start local Supabase
supabase start

# Deploy functions locally
supabase functions serve

# Test a function
curl -i --location --request POST 'http://localhost:54321/functions/v1/transcribe-voicemail' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"voicemailId":"test-id","audioUrl":"https://example.com/test.mp3"}'
```

**Production Testing**:
```bash
# Test deployed function
supabase functions invoke transcribe-voicemail \
  --body '{"voicemailId":"test-id","audioUrl":"https://example.com/test.mp3"}' \
  --method POST
```

## Monitoring

**View Logs**:
```bash
# All functions
supabase functions logs

# Specific function
supabase functions logs transcribe-voicemail

# Follow logs in real-time
supabase functions logs --follow
```

## Architecture

```
React Native App
    ↓
Supabase Client (with JWT token)
    ↓
Supabase Edge Functions
    ↓
External APIs (OpenAI, Anthropic, Stripe)
```

**Security**:
- All API keys stored as Supabase secrets (never exposed to client)
- JWT tokens used for authentication (validated in each function)
- RLS policies on database tables enforce user-level access
- Stripe webhook signature verification prevents unauthorized requests

## Cost Optimization

**Tips to reduce costs**:
1. **Cache results** where appropriate (e.g., threat analysis for identical texts)
2. **Implement rate limiting** per user tier
3. **Use shorter transcripts** for sentiment analysis (first 1000 chars)
4. **Monitor usage** regularly via Supabase Dashboard
5. **Set up billing alerts** for OpenAI, Anthropic, and Stripe

## Troubleshooting

**Common Issues**:

1. **"OPENAI_API_KEY not configured"**
   - Set secret: `supabase secrets set OPENAI_API_KEY="sk-..."`

2. **"Invalid authentication token"**
   - Ensure JWT token is being passed in Authorization header
   - Check token hasn't expired

3. **"Failed to download audio file"**
   - Verify storage bucket exists and has correct policies
   - Check audio URL is publicly accessible

4. **"Stripe webhook signature verification failed"**
   - Verify webhook secret matches Stripe Dashboard
   - Ensure using correct secret for this endpoint

## Support

- **Supabase Edge Functions Docs**: https://supabase.com/docs/guides/functions
- **Deno Runtime Docs**: https://deno.land/manual
- **OpenAI API Reference**: https://platform.openai.com/docs
- **Anthropic API Reference**: https://docs.anthropic.com
- **Stripe API Reference**: https://stripe.com/docs/api

---

**Last Updated**: 2025-11-30
**Status**: Production Ready
