# Setting Up Google OAuth for Local Supabase Development

## Can Google OAuth Work Locally?
Yes, but it requires configuration both in Google Cloud Console and your local Supabase config.

## Steps to Enable Google OAuth Locally

### 1. Get Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth Client ID**
5. Configure:
   - Application type: **Web application**
   - Name: "TutorReview Local Dev"
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `http://localhost:54321`
   - Authorized redirect URIs:
     - `http://localhost:54321/auth/v1/callback`
6. Save and copy your **Client ID** and **Client Secret**

### 2. Configure Local Supabase

Create or edit `supabase/config.toml` in your project root:

```toml
[auth]
# Enable email auth (already enabled by default)
enable_signup = true

[auth.external.google]
enabled = true
client_id = "YOUR_GOOGLE_CLIENT_ID"
secret = "YOUR_GOOGLE_CLIENT_SECRET"
# Redirect URL - Supabase will handle this
redirect_uri = "http://localhost:54321/auth/v1/callback"
```

### 3. Update Your Environment Variables

Add to your `.env.local`:
```env
# These are for the UI to know Google is enabled
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true
```

### 4. Restart Supabase

After updating the config:
```bash
npm run db:stop
npm run db:start
```

### 5. Check if Google Provider is Enabled

You can verify by visiting:
http://localhost:54321/auth/v1/providers

You should see Google in the list.

## Alternative: Skip OAuth for Local Development

**Recommendation**: For local development, it's often easier to just use email/password auth and test OAuth in a staging environment.

### Quick Test User Setup

You can create test users directly in local Supabase:

1. **Via Supabase Studio** (http://localhost:54323):
   - Go to Authentication → Users
   - Click "Add User"
   - Create with email/password

2. **Via SQL** (in Supabase Studio SQL Editor):
```sql
-- Create a test admin user (password: testpass123)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@test.com',
  crypt('testpass123', gen_salt('bf')),
  now(),
  now(),
  now()
);
```

## Quick Solution: Disable Google Button for Local

If you want to hide the Google button in local development:

```typescript
// In your sign-in/sign-up pages, add this check:
const isLocalDev = process.env.NODE_ENV === 'development' &&
                   process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')

// Then conditionally render the Google button:
{!isLocalDev && (
  <Button onClick={handleGoogleSignIn}>
    Sign in with Google
  </Button>
)}
```

## Testing Email Authentication Locally

1. Sign up with any email
2. Open Inbucket: http://localhost:54324
3. Click on the email to see the confirmation link
4. Click the confirmation link
5. You can now sign in!

No real emails are sent - everything stays local!