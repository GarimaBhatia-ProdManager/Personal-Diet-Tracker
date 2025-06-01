# Google OAuth Setup Guide

The "This content is blocked" error occurs because Google OAuth is not properly configured in Supabase. Here's how to fix it:

## 🔧 Supabase Configuration

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set Application type to "Web application"
6. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for development)

### 2. Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and click to configure
4. Enable Google provider
5. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
6. Save the configuration

### 3. Update Redirect URLs

Make sure your redirect URLs match in both:
- Google Cloud Console OAuth settings
- Supabase Auth settings

## 🚀 Testing

After configuration:
1. Deploy your app or test locally
2. Try Google sign-in - should redirect to Google
3. Complete OAuth flow - should redirect back to your app

## 🔄 Current Workaround

Until Google OAuth is configured, the app provides:
- ✅ **Email/Password Authentication** - Fully functional
- ✅ **Demo Account** - Quick testing with pre-filled credentials
- ✅ **Error Handling** - Clear messages about OAuth status
- ✅ **Graceful Fallback** - App works perfectly without Google OAuth

## 📧 Demo Account

For immediate testing:
- **Email**: demo@example.com
- **Password**: demo123

Click "Fill Demo Credentials" button for quick access.

## 🛠️ Production Checklist

- [ ] Google Cloud Console project created
- [ ] OAuth 2.0 credentials configured
- [ ] Supabase Google provider enabled
- [ ] Redirect URLs match between Google and Supabase
- [ ] Test OAuth flow in production environment

The app maintains full functionality with email authentication while Google OAuth is being set up.
