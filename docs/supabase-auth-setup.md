# Supabase Authentication Setup Guide

## Overview
This document outlines the manual steps required to configure Supabase authentication for the TutorReview application.

## Prerequisites
- Supabase account (create one at https://supabase.com)
- Access to Supabase Dashboard

## Manual Setup Steps

### 1. Local Development Setup (Already Configured)
The application is configured to work with Supabase local development by default:
- Local Supabase URL: `http://localhost:54321`
- Uses default local development keys

To start local Supabase:
```bash
npm run db:start
```

### 2. For Production Deployment

#### Step 1: Create a Supabase Project
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Enter project details:
   - Name: "TutorReview" (or your preferred name)
   - Database Password: Generate a strong password
   - Region: Choose closest to your users
4. Click "Create Project" and wait for setup

#### Step 2: Get Project Credentials
1. In your Supabase Dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (safe for client-side)
   - **Service Role Key** (keep secret, server-side only)

#### Step 3: Update Environment Variables
Create a `.env.production` file with your production credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Configure Authentication Providers

#### Email Authentication (Already Enabled by Default)
Email authentication works out of the box. Users can sign up with:
- Email and password
- Confirmation email will be sent

To customize email templates:
1. Go to **Authentication** → **Email Templates**
2. Customize confirmation, recovery, and invitation emails

#### Google OAuth Setup
To enable Google sign-in:

1. **Get Google OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
   - Application type: Web application
   - Add Authorized redirect URIs:
     - For local: `http://localhost:54321/auth/v1/callback`
     - For production: `https://xxxxx.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**

2. **Configure in Supabase:**
   - Go to Supabase Dashboard → **Authentication** → **Providers**
   - Find **Google** and click to expand
   - Toggle **Enable Google provider**
   - Enter your **Client ID** and **Client Secret**
   - Save the configuration

### 4. Configure Site URL and Redirect URLs

In Supabase Dashboard → **Authentication** → **URL Configuration**:

1. **Site URL**:
   - Local: `http://localhost:3000`
   - Production: `https://your-domain.com`

2. **Redirect URLs** (add all that apply):
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`
   - `http://localhost:3000/dashboard`
   - `https://your-domain.com/dashboard`

### 5. Set Up Database Tables and RLS

The application uses Supabase's built-in `auth.users` table. Additional user profile data should be stored in a separate table.

1. **Create a profiles table** (optional, for additional user data):
```sql
-- Run this in Supabase SQL Editor
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 6. Test Authentication Flow

1. **Start the development server:**
```bash
npm run dev
```

2. **Test sign-up flow:**
   - Navigate to `/auth/sign-up`
   - Create a new account with email
   - Check email for confirmation link
   - Confirm account and sign in

3. **Test Google OAuth:**
   - Click "Sign in with Google"
   - Complete Google authentication
   - Should redirect to dashboard

### 7. Create Admin Users

For the MVP, create 3-5 admin users for testing:

1. **Via Supabase Dashboard:**
   - Go to **Authentication** → **Users**
   - Click **Invite User**
   - Enter email addresses for admin users
   - They'll receive invitation emails

2. **Via SQL (for immediate access):**
```sql
-- Run in SQL Editor to create test admin users
-- Note: In production, use proper password hashing
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, role)
VALUES
  ('admin1@tutorreview.com', crypt('password123', gen_salt('bf')), NOW(), 'authenticated'),
  ('admin2@tutorreview.com', crypt('password123', gen_salt('bf')), NOW(), 'authenticated'),
  ('admin3@tutorreview.com', crypt('password123', gen_salt('bf')), NOW(), 'authenticated');
```

## Troubleshooting

### Common Issues:

1. **"Invalid API key" error:**
   - Check that environment variables are loaded correctly
   - Ensure you're using the correct keys for your environment

2. **Google OAuth not working:**
   - Verify redirect URLs match exactly
   - Check that Google provider is enabled in Supabase
   - Ensure Client ID and Secret are correct

3. **Users can't access dashboard:**
   - Check middleware is running (check browser DevTools network tab)
   - Verify session cookies are being set
   - Check RLS policies if using custom tables

4. **Email confirmation not working:**
   - Check spam folder
   - Verify SMTP settings in Supabase (for custom SMTP)
   - Check email template configuration

## Security Notes

1. **Never expose Service Role Key** - only use in server-side code
2. **Always use environment variables** for sensitive keys
3. **Enable RLS** on all custom tables
4. **Use HTTPS in production** for all redirect URLs
5. **Implement rate limiting** for authentication endpoints

## Next Steps

After completing authentication setup:
1. Implement user roles (admin, viewer, etc.)
2. Add user profile management
3. Set up password recovery flow
4. Implement session management
5. Add two-factor authentication (optional)

## Support

For Supabase-specific issues:
- Documentation: https://supabase.com/docs/guides/auth
- Community: https://github.com/supabase/supabase/discussions
- Support: https://supabase.com/support