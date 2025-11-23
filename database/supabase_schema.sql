-- CallWall Mobile App Database Schema
-- This SQL script should be run in the Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'business');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due');
CREATE TYPE document_type AS ENUM ('debt_validation', 'cease_desist', 'custom');
CREATE TYPE document_status AS ENUM ('draft', 'generated', 'sent');
CREATE TYPE voicemail_category AS ENUM ('personal', 'business', 'legal', 'spam');
CREATE TYPE voice_personality AS ENUM ('Friendly Helper', 'Enthusiastic Coach', 'Wise Sage', 'Quirky Robot', 'Mysterious Guide', 'Cheerful Friend');
CREATE TYPE phone_label AS ENUM ('home', 'work', 'mobile', 'other');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone_number TEXT,
    subscription_tier subscription_tier DEFAULT 'free' NOT NULL,
    subscription_status subscription_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    preferences JSONB DEFAULT '{}',

    -- Foreign key relationship to Supabase auth
    CONSTRAINT fk_users_auth_id
        FOREIGN KEY (id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users RLS policies
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Legal Documents table
CREATE TABLE legal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    template_data JSONB DEFAULT '{}',
    generated_content TEXT,
    pdf_url TEXT,
    status document_status DEFAULT 'draft' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for legal_documents
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

-- Legal Documents RLS policies
CREATE POLICY "Users can view own documents"
    ON legal_documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own documents"
    ON legal_documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
    ON legal_documents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
    ON legal_documents FOR DELETE
    USING (auth.uid() = user_id);

-- Voicemail Messages table
CREATE TABLE voicemail_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    transcript TEXT,
    category voicemail_category DEFAULT 'personal' NOT NULL,
    sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    duration INTEGER NOT NULL, -- duration in seconds
    transcription_status TEXT DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    thumbnail_url TEXT
);

-- Enable RLS for voicemail_messages
ALTER TABLE voicemail_messages ENABLE ROW LEVEL SECURITY;

-- Voicemail Messages RLS policies
CREATE POLICY "Users can view own voicemail"
    ON voicemail_messages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own voicemail"
    ON voicemail_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voicemail"
    ON voicemail_messages FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own voicemail"
    ON voicemail_messages FOR DELETE
    USING (auth.uid() = user_id);

-- Phone Numbers table
CREATE TABLE phone_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_number TEXT UNIQUE NOT NULL,
    label phone_label DEFAULT 'mobile' NOT NULL,
    is_blocked BOOLEAN DEFAULT false NOT NULL,
    call_count INTEGER DEFAULT 0 NOT NULL,
    last_call TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT phone_number_format CHECK (phone_number ~ '^\+?[1-9]\d{1,14}$')
);

-- Enable RLS for phone_numbers
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

-- Phone Numbers RLS policies
CREATE POLICY "Users can view own phone numbers"
    ON phone_numbers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own phone numbers"
    ON phone_numbers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phone numbers"
    ON phone_numbers FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own phone numbers"
    ON phone_numbers FOR DELETE
    USING (auth.uid() = user_id);

-- Voice Generations table
CREATE TABLE voice_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    personality voice_personality NOT NULL,
    input_text TEXT NOT NULL,
    audio_url TEXT NOT NULL,
    pitch DECIMAL(3,2) DEFAULT 1.0 CHECK (pitch >= 0.5 AND pitch <= 2.0),
    speed DECIMAL(3,2) DEFAULT 1.0 CHECK (speed >= 0.5 AND speed <= 2.0),
    volume DECIMAL(3,2) DEFAULT 1.0 CHECK (volume >= 0.0 AND volume <= 1.0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    character_count INTEGER NOT NULL,
    processing_time_ms INTEGER
);

-- Enable RLS for voice_generations
ALTER TABLE voice_generations ENABLE ROW LEVEL SECURITY;

-- Voice Generations RLS policies
CREATE POLICY "Users can view own voice generations"
    ON voice_generations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own voice generations"
    ON voice_generations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice generations"
    ON voice_generations FOR DELETE
    USING (auth.uid() = user_id);

-- Threat Analyses table
CREATE TABLE threat_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    communication_type TEXT NOT NULL CHECK (communication_type IN ('phone_call', 'text_message', 'email', 'voicemail', 'letter')),
    content TEXT NOT NULL,
    threat_level TEXT NOT NULL CHECK (threat_level IN ('low', 'medium', 'high')),
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative', 'hostile')),
    threats JSONB DEFAULT '[]',
    legal_violations JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    summary TEXT,
    emotional_impact JSONB DEFAULT '{}',
    sender_info JSONB DEFAULT '{}',
    ai_model_used TEXT,
    analysis_confidence DECIMAL(3,2) CHECK (analysis_confidence >= 0 AND analysis_confidence <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for threat_analyses
ALTER TABLE threat_analyses ENABLE ROW LEVEL SECURITY;

-- Threat Analyses RLS policies
CREATE POLICY "Users can view own threat analyses"
    ON threat_analyses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own threat analyses"
    ON threat_analyses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Subscription Events table (for webhook processing)
CREATE TABLE subscription_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for subscription_events
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Indexes for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_legal_documents_user_id ON legal_documents(user_id);
CREATE INDEX idx_legal_documents_status ON legal_documents(status);
CREATE INDEX idx_legal_documents_created_at ON legal_documents(created_at DESC);
CREATE INDEX idx_voicemail_messages_user_id ON voicemail_messages(user_id);
CREATE INDEX idx_voicemail_messages_created_at ON voicemail_messages(created_at DESC);
CREATE INDEX idx_voicemail_messages_category ON voicemail_messages(category);
CREATE INDEX idx_phone_numbers_user_id ON phone_numbers(user_id);
CREATE INDEX idx_phone_numbers_phone_number ON phone_numbers(phone_number);
CREATE INDEX idx_phone_numbers_is_blocked ON phone_numbers(is_blocked);
CREATE INDEX idx_voice_generations_user_id ON voice_generations(user_id);
CREATE INDEX idx_voice_generations_created_at ON voice_generations(created_at DESC);
CREATE INDEX idx_threat_analyses_user_id ON threat_analyses(user_id);
CREATE INDEX idx_threat_analyses_threat_level ON threat_analyses(threat_level);
CREATE INDEX idx_threat_analyses_created_at ON threat_analyses(created_at DESC);
CREATE INDEX idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX idx_subscription_events_stripe_event_id ON subscription_events(stripe_event_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_documents_updated_at BEFORE UPDATE ON legal_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phone_numbers_updated_at BEFORE UPDATE ON phone_numbers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage policies for Supabase Storage (need to be configured in Supabase Dashboard)
-- Bucket: voicemail-audio
-- Bucket: legal-documents
-- Bucket: voice-generations

-- Row Level Security for Storage (configure in Supabase Dashboard)
-- Policy: Users can only access their own files in their respective buckets

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, phone_number)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'phone_number'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sample data insertion for testing (remove in production)
-- INSERT INTO users (id, email, full_name, subscription_tier)
-- VALUES (
--     uuid_generate_v4(),
--     'test@example.com',
--     'Test User',
--     'free'
-- ) ON CONFLICT (email) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.legal_documents TO authenticated;
GRANT ALL ON public.voicemail_messages TO authenticated;
GRANT ALL ON public.phone_numbers TO authenticated;
GRANT ALL ON public.voice_generations TO authenticated;
GRANT ALL ON public.threat_analyses TO authenticated;
GRANT ALL ON public.subscription_events TO authenticated;

-- Grant usage of sequences
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE legal_documents_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE voicemail_messages_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE phone_numbers_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE voice_generations_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE threat_analyses_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE subscription_events_id_seq TO authenticated;