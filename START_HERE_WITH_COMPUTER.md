# START HERE - I Found a Computer! 💻

## You're About to Build CallWall in Under 1 Hour!

Follow these steps EXACTLY and you'll have the app on your iPhone in ~45 minutes!

---

## STEP 1: Get the Code on This Computer (5 minutes)

You need to get the CallWall code on the computer you're using.

### Option A: If Code is on GitHub
```bash
git clone YOUR_GITHUB_URL
cd callwall  # or whatever folder name
```

### Option B: If Code is NOT on GitHub Yet
**Tell me!** I'll help you:
- Download it as a ZIP
- Or push to GitHub first
- Or transfer another way

### Option C: If You're Using the SAME Computer as Before
```bash
cd /path/to/where/you/saved/Call
```

---

## STEP 2: Install Node.js (if not installed) (5 minutes)

### Check if you have it:
```bash
node --version
```

If you see a version number (like v18.x.x), **SKIP TO STEP 3!**

### If you DON'T have Node.js:

**On Mac:**
```bash
# Install Homebrew first (if you don't have it)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Then install Node.js
brew install node
```

**On Windows:**
1. Go to https://nodejs.org
2. Download LTS version
3. Run installer
4. Click Next, Next, Next, Install
5. Restart Command Prompt

**On Linux:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# Other distros: use your package manager
```

---

## STEP 3: Navigate to Project Folder (1 minute)

```bash
# Go to wherever you put the Call folder
cd /path/to/Call

# Verify you're in the right place
ls -la

# You should see:
# - package.json
# - app.json
# - src/
# - eas.json
```

---

## STEP 4: Install Dependencies (3 minutes)

```bash
npm install
```

Wait for it to finish (might take 2-3 minutes).

---

## STEP 5: Install EAS CLI (2 minutes)

```bash
npm install -g eas-cli
```

Verify:
```bash
eas --version
```

Should show: `eas-cli/x.x.x`

---

## STEP 6: Login to Expo (2 minutes)

```bash
eas login
```

**Don't have an Expo account?**
```bash
eas register
```

Follow prompts to create account.

---

## STEP 7: Create .env File (2 minutes)

```bash
# Copy the example
cp .env.example .env

# Edit it
nano .env  # or use any text editor
```

**IMPORTANT:** Set this line:
```
EXPO_PUBLIC_MOCK_MODE=true
```

**Save and exit** (Ctrl+X, then Y, then Enter if using nano)

---

## STEP 8: Initialize EAS (3 minutes)

```bash
eas init
```

**Prompts you'll see:**
- "Would you like to create a project?" → **YES**
- "Project name?" → **callwall** (or whatever you want)

This links your project to your Expo account.

---

## STEP 9: START THE BUILDS! 🚀 (5 min work, 20-30 min wait)

### iOS Build:
```bash
eas build --platform ios --profile preview
```

### Android Build (optional, but recommended):
```bash
eas build --platform android --profile preview
```

**What happens:**
- Code uploads to EAS servers
- Builds in the cloud
- You get a URL when done

**This takes 20-30 minutes. You can close the terminal and check status at:**
https://expo.dev/accounts/YOUR_USERNAME/projects/callwall/builds

---

## STEP 10: While Builds Run - Set Up Supabase! (15 minutes)

### 10.1: Create Supabase Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up (FREE - no credit card needed)

### 10.2: Create Project
1. Click "New Project"
2. Fill in:
   - **Name**: callwall-dev
   - **Database Password**: (generate strong one - SAVE IT!)
   - **Region**: (choose closest to you)
   - **Plan**: **Free**
3. Click "Create new project"
4. Wait ~2 minutes

### 10.3: Get Your Credentials
1. Go to **Settings** → **API**
2. Copy these values:
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc...
   ```

### 10.4: Update .env File
```bash
nano .env
```

Add your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_MOCK_MODE=true
```

Save and exit.

### 10.5: Run Database Schema
1. In Supabase Dashboard → **SQL Editor**
2. Click "New query"
3. Open the file: `DATABASE_SCHEMA.md` (in your project folder)
4. Copy ALL the SQL code
5. Paste into Supabase SQL Editor
6. Click **Run** (bottom right)
7. Wait for "Success" ✅

**DONE! Your database is ready!**

---

## STEP 11: Check Build Status (after 20-30 min)

```bash
eas build:list
```

Or go to: https://expo.dev

When status shows **"FINISHED"**:
- Click the build
- Download or scan QR code

---

## STEP 12: Install on iPhone! 📱

### From the Build Page:
1. **Scan QR code** with your iPhone camera
2. **Or click "Install"** link on your iPhone
3. Follow prompts to install

**For iOS:**
- Might need to trust developer profile
- Settings → General → VPN & Device Management
- Trust your Apple ID

**BOOM! CallWall is on your iPhone!** 🎉

---

## STEP 13: Test the App!

1. **Open CallWall** on your iPhone
2. **Register** a new account
3. **Test features**:
   - ✅ Login works?
   - ✅ Legal documents (generate a PDF)?
   - ✅ Phone management?
   - ✅ Voicemail (shows mock transcription)?
   - ✅ Subscription screens?

---

## Troubleshooting:

### "npm: command not found"
→ You need to install Node.js (see STEP 2)

### "eas: command not found"
→ Try: `npx eas-cli` instead of `eas`

### Build fails
→ Run: `eas build:view` to see error logs
→ Or check: https://expo.dev for build details

### Can't install on iPhone
→ Check Settings → General → VPN & Device Management
→ Trust the developer profile

---

## When You're Done:

**Message back with:**
- ✅ "Build started!" (when builds begin)
- ✅ "Supabase ready!" (when database is set up)
- ✅ "App installed!" (when on your iPhone)
- 🎉 "IT WORKS!" (when you test it)

---

## Need Help?

**If you get stuck:**
1. Take a screenshot of the error
2. Tell me what step you're on
3. I'll help you fix it immediately!

---

**TOTAL TIME: ~45 minutes** (most of it is just waiting for builds)

**LET'S GOOOO! 🚀🔥**
