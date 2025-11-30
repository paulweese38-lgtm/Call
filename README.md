# CallWall Mobile App

A comprehensive communication management and protection platform for iOS and Android, built with React Native and Expo.

## Features

- 📄 **Legal Protection Tools** - Generate FDCPA-compliant debt validation and cease & desist letters
- 🎙️ **Voicemail Intelligence** - AI-powered transcription and threat analysis
- 📞 **Phone Management** - Track, block, and analyze phone numbers
- 🎤 **Voice Playground** - AI text-to-speech with 6 unique personalities
- 💳 **Freemium Subscriptions** - Free, Premium ($9.99/mo), and Business ($29.99/mo) tiers
- 🔒 **Secure & Private** - End-to-end encryption and secure data storage

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator
- Supabase account and project

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Set up database
# Run SQL from DATABASE_SCHEMA.md in your Supabase SQL Editor

# Start development server
npm start
```

### Running the App

```bash
# iOS
npm run ios

# Android
npm run android
```

## Technology Stack

- **Frontend**: React Native + Expo SDK 50+
- **UI Library**: NativeBase
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI Services**: OpenAI (Whisper, TTS), Anthropic (Claude)
- **Payments**: Stripe

## Implementation Status

### ✅ Completed
- Core infrastructure and configuration
- Supabase backend integration
- Complete database schema
- Authentication system with biometric support
- All business logic services
- Navigation structure

### 🔄 Remaining
- UI screens for main features (architecture in place)
- AI API integrations via Edge Functions
- Stripe payment integration
- Production assets

See `IMPLEMENTATION_NOTES.md` for detailed status and `DATABASE_SCHEMA.md` for database setup.

---

Built with React Native + Expo | Powered by Supabase
