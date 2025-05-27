# 🔧 Google OAuth Redirect URI Fix

## ❌ Current Error
**Error 400: bad_request - redirect_uri_mismatch**

The redirect URI in your Google Cloud Console doesn't match your Supabase project URL.

## ✅ Solution Steps

### 1. Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or the one with Client ID: `736608828491-i0257sbvipmvlqn1pd3c68197pg35gnj`)

### 2. Navigate to OAuth Settings
1. Go to **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID
3. Click the **Edit** button (pencil icon)

### 3. Add the Correct Redirect URI
Add this **exact** URI to your **Authorized redirect URIs**:

\`\`\`
https://ussapzuqhkmrrtislyupi.supabase.co/auth/v1/callback
\`\`\`

### 4. For Development (Optional)
Also add your local development URL:

\`\`\`
http://localhost:3000/auth/callback
\`\`\`

### 5. Save Changes
1. Click **Save** in Google Cloud Console
2. Wait 5-10 minutes for changes to propagate

## 🎯 Your Specific URLs

**Production**: `https://ussapzuqhkmrrtislyupi.supabase.co/auth/v1/callback`
**Development**: `http://localhost:3000/auth/callback`

## ✅ Verification

After adding the redirect URI:
1. Try Google sign-in again
2. Should redirect to Google successfully
3. Should return to your app after authentication

## 🔄 Alternative: Use Email Authentication

While fixing OAuth, you can use:
- ✅ **Email/Password sign-in** (works immediately)
- ✅ **Demo account**: demo@example.com / demo123
