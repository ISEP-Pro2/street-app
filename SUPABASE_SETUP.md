# Supabase Setup Instructions

## Step 1: Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Sign in or create account
3. Click "New Project"
4. Choose a project name, database password, region
5. Wait for project to initialize (2-3 minutes)

## Step 2: Create Database Tables & RLS

1. In your Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the entire contents from: `supabase/migrations/001_init_schema.sql`
4. Click "Run" to execute
5. Wait for confirmation that tables are created

## Step 3: Enable Email Authentication

1. In your Supabase dashboard, go to **Authentication → Providers**
2. Make sure "Email" is enabled (default is usually enabled)
3. Go to **Settings → Auth → Email Templates**
4. The default templates should work fine

## Step 4: Get Your Credentials

1. Go to **Settings → API** in Supabase
2. Copy:
   - **Project URL** → `https://nlwdpmjqklwzkcfjpmfb.supabase.co`
   - **anon public** key → `sb_publishable_KF_36H3jmiSlX6HwclwvVg_o6JTSYoa`

## Step 5: Configure Your App

1. In the project root, copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and paste your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-long-anon-key-here
   ```

3. Save the file

## Step 6: Start the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you should be redirected to the login page.

## Verify Setup

1. **Create Account**: Go to /auth/signup and create an account
2. **Check Database**: In Supabase dashboard → Table Editor → `user_preferences` should show your new user
3. **Log a Set**: Click "Quick Add" and log a training set
4. **Verify Data**: In Supabase → `sets` table should show your logged set

## Troubleshooting

### "Network Error" when signing up
- Check your `.env.local` file has the correct SUPABASE_URL
- Make sure the URL doesn't have trailing slashes
- Check that your Supabase project is active

### "User already exists" 
- This email is already registered - try another email

### "Not authenticated" when trying to log a set
- Clear your browser cookies and localStorage
- Hard refresh (Ctrl+Shift+R)
- Try logging out and back in

### Tables not created
- Check SQL execution output for errors
- Make sure you copied the entire migration file
- All tables should appear in Table Editor within seconds

## Important Security Notes

- ⚠️ Keep your `.env.local` file **private** - never commit to git
- ⚠️ The anon key is safe to expose (used in browser) but URL should be protected in production
- ✅ All database operations are protected by RLS policies
- ✅ Users can only see/modify their own data

## Next Steps

1. Set up your Supabase as described above
2. Run `npm run dev` to start the development server
3. Create a test account
4. Test the full workflow in the [Testing Checklist](./TESTING.md)

---

Need help? Check the [Supabase docs](https://supabase.com/docs) or [Next.js Supabase guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
