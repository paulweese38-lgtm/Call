# CallWall Database Schema

This document describes the Supabase PostgreSQL database schema for the CallWall mobile app.

**IMPORTANT:** All SQL commands below must be executed in the Supabase SQL Editor.

## Tables

### 1. users

Extends Supabase auth.users table with profile and subscription information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'business')),
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due')),
  stripe_customer_id TEXT UNIQUE,
  subscription_period_start TIMESTAMPTZ,
  subscription_period_end TIMESTAMPTZ,
  usage_reset_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX users_subscription_tier_idx ON users(subscription_tier);
CREATE INDEX users_updated_at_idx ON users(updated_at);
CREATE UNIQUE INDEX users_stripe_customer_id_idx ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can do anything" ON users
  USING (auth.role() = 'service_role');

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user profile on auth.users insert
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();
```

### 2. legal_documents

Stores user-generated legal documents (debt validation, cease & desist).

```sql
CREATE TABLE legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('debt_validation', 'cease_desist', 'custom')),
  template_data JSONB NOT NULL,
  generated_content TEXT NOT NULL,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'sent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX legal_documents_user_id_idx ON legal_documents(user_id);
CREATE INDEX legal_documents_user_created_idx ON legal_documents(user_id, created_at DESC);
CREATE INDEX legal_documents_type_idx ON legal_documents(document_type);
CREATE INDEX legal_documents_status_idx ON legal_documents(status);

-- RLS Policies
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON legal_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON legal_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON legal_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON legal_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER legal_documents_updated_at BEFORE UPDATE ON legal_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 3. voicemail_messages

Stores voicemail recordings and AI transcriptions.

```sql
CREATE TABLE voicemail_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  audio_hash TEXT,
  transcript TEXT,
  category TEXT NOT NULL DEFAULT 'personal' CHECK (category IN ('personal', 'business', 'legal', 'spam')),
  sentiment_score DECIMAL(3,2),
  threat_level TEXT CHECK (threat_level IN ('none', 'low', 'medium', 'high', 'critical')),
  duration INTEGER NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX voicemail_messages_user_id_idx ON voicemail_messages(user_id);
CREATE INDEX voicemail_messages_user_created_idx ON voicemail_messages(user_id, created_at DESC);
CREATE INDEX voicemail_messages_phone_idx ON voicemail_messages(phone_number);
CREATE INDEX voicemail_messages_category_idx ON voicemail_messages(category);
CREATE INDEX voicemail_messages_threat_idx ON voicemail_messages(threat_level);
CREATE INDEX voicemail_messages_read_idx ON voicemail_messages(is_read);
CREATE UNIQUE INDEX voicemail_messages_hash_idx ON voicemail_messages(audio_hash) WHERE audio_hash IS NOT NULL;

-- RLS Policies
ALTER TABLE voicemail_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voicemails" ON voicemail_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voicemails" ON voicemail_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voicemails" ON voicemail_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own voicemails" ON voicemail_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER voicemail_messages_updated_at BEFORE UPDATE ON voicemail_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 4. phone_numbers

Tracks phone numbers and call history.

```sql
CREATE TABLE phone_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  label TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  call_count INTEGER NOT NULL DEFAULT 0,
  last_call_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, phone_number)
);

-- Indexes
CREATE INDEX phone_numbers_user_id_idx ON phone_numbers(user_id);
CREATE INDEX phone_numbers_blocked_idx ON phone_numbers(is_blocked);
CREATE INDEX phone_numbers_phone_idx ON phone_numbers(phone_number);

-- RLS Policies
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own phone numbers" ON phone_numbers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own phone numbers" ON phone_numbers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phone numbers" ON phone_numbers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own phone numbers" ON phone_numbers
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER phone_numbers_updated_at BEFORE UPDATE ON phone_numbers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 5. voice_generations

Stores AI voice generation history.

```sql
CREATE TABLE voice_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  personality TEXT NOT NULL CHECK (personality IN ('friendly_helper', 'enthusiastic_coach', 'wise_sage', 'quirky_robot', 'mysterious_guide', 'cheerful_friend')),
  input_text TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  openai_voice TEXT NOT NULL CHECK (openai_voice IN ('alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer')),
  pitch DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  speed DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  duration INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX voice_generations_user_id_idx ON voice_generations(user_id);
CREATE INDEX voice_generations_user_created_idx ON voice_generations(user_id, created_at DESC);
CREATE INDEX voice_generations_personality_idx ON voice_generations(personality);

-- RLS Policies
ALTER TABLE voice_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice generations" ON voice_generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice generations" ON voice_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice generations" ON voice_generations
  FOR DELETE USING (auth.uid() = user_id);
```

### 6. usage_tracking

Tracks monthly usage per user for tier enforcement.

```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  legal_documents_count INTEGER NOT NULL DEFAULT 0,
  voicemail_transcriptions_count INTEGER NOT NULL DEFAULT 0,
  voice_generations_count INTEGER NOT NULL DEFAULT 0,
  storage_used_mb DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Indexes
CREATE INDEX usage_tracking_user_id_idx ON usage_tracking(user_id);
CREATE INDEX usage_tracking_month_idx ON usage_tracking(month);

-- RLS Policies
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can update usage" ON usage_tracking
  USING (auth.role() = 'service_role');

-- Triggers
CREATE TRIGGER usage_tracking_updated_at BEFORE UPDATE ON usage_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## PostgreSQL Functions

### check_tier_limit

Checks if user has reached tier limit before allowing operation.

```sql
CREATE OR REPLACE FUNCTION check_tier_limit(
  p_user_id UUID,
  p_operation_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_current_count INTEGER;
  v_limit INTEGER;
  v_current_month DATE;
BEGIN
  -- Get user tier
  SELECT subscription_tier INTO v_tier
  FROM users
  WHERE id = p_user_id;

  -- Get current month
  v_current_month := date_trunc('month', NOW());

  -- Get current usage
  SELECT
    CASE
      WHEN p_operation_type = 'legal_document' THEN legal_documents_count
      WHEN p_operation_type = 'voicemail_transcription' THEN voicemail_transcriptions_count
      WHEN p_operation_type = 'voice_generation' THEN voice_generations_count
      ELSE 0
    END INTO v_current_count
  FROM usage_tracking
  WHERE user_id = p_user_id AND month = v_current_month;

  -- If no record exists, usage is 0
  v_current_count := COALESCE(v_current_count, 0);

  -- Determine limit based on tier
  v_limit := CASE
    WHEN v_tier = 'free' THEN
      CASE
        WHEN p_operation_type = 'legal_document' THEN 2
        WHEN p_operation_type = 'voicemail_transcription' THEN 10
        WHEN p_operation_type = 'voice_generation' THEN 5
        ELSE 0
      END
    WHEN v_tier = 'premium' THEN
      CASE
        WHEN p_operation_type = 'legal_document' THEN 999999
        WHEN p_operation_type = 'voicemail_transcription' THEN 100
        WHEN p_operation_type = 'voice_generation' THEN 50
        ELSE 0
      END
    WHEN v_tier = 'business' THEN
      CASE
        WHEN p_operation_type = 'legal_document' THEN 999999
        WHEN p_operation_type = 'voicemail_transcription' THEN 500
        WHEN p_operation_type = 'voice_generation' THEN 200
        ELSE 0
      END
    ELSE 0
  END;

  -- Return true if under limit
  RETURN v_current_count < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### increment_usage

Increments usage counter after successful operation.

```sql
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_operation_type TEXT
)
RETURNS VOID AS $$
DECLARE
  v_current_month DATE;
BEGIN
  v_current_month := date_trunc('month', NOW());

  -- Upsert usage record
  INSERT INTO usage_tracking (user_id, month, legal_documents_count, voicemail_transcriptions_count, voice_generations_count)
  VALUES (
    p_user_id,
    v_current_month,
    CASE WHEN p_operation_type = 'legal_document' THEN 1 ELSE 0 END,
    CASE WHEN p_operation_type = 'voicemail_transcription' THEN 1 ELSE 0 END,
    CASE WHEN p_operation_type = 'voice_generation' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, month) DO UPDATE SET
    legal_documents_count = usage_tracking.legal_documents_count +
      CASE WHEN p_operation_type = 'legal_document' THEN 1 ELSE 0 END,
    voicemail_transcriptions_count = usage_tracking.voicemail_transcriptions_count +
      CASE WHEN p_operation_type = 'voicemail_transcription' THEN 1 ELSE 0 END,
    voice_generations_count = usage_tracking.voice_generations_count +
      CASE WHEN p_operation_type = 'voice_generation' THEN 1 ELSE 0 END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Storage Buckets

### documents bucket

```sql
-- Create bucket via Supabase dashboard or SQL
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- RLS Policies
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### voicemails bucket

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('voicemails', 'voicemails', false);

-- RLS Policies (same pattern as documents)
```

### voice_generations bucket

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice_generations', 'voice_generations', false);

-- RLS Policies (same pattern as documents)
```

## Setup Instructions

1. Open Supabase SQL Editor
2. Execute all SQL commands above in order
3. Verify tables are created with correct RLS policies
4. Test authentication and basic queries
5. Create storage buckets via dashboard or SQL
6. Apply storage RLS policies

## Testing Queries

```sql
-- Test user creation
SELECT * FROM users WHERE email = 'test@example.com';

-- Test tier limit check
SELECT check_tier_limit('user-uuid-here', 'legal_document');

-- Test usage tracking
SELECT * FROM usage_tracking WHERE user_id = 'user-uuid-here';
```
