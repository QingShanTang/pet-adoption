# Supabase Setup

## Steps

1. **Create a Supabase project** at https://supabase.com (free tier)

2. **Copy credentials** from Project Settings → API into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Run schema** in Supabase Dashboard → SQL Editor:
   - Copy and run `migrations/001_initial_schema.sql`

4. **Create storage bucket** in Dashboard → Storage:
   - Create bucket named `pet-images`
   - Set as **Public**

5. **Run storage policies** in SQL Editor:
   - Copy and run `storage.sql`

6. **Run seed data** (optional, for development):
   - Copy and run `seed.sql`

7. **Create admin user**:
   - Register via the app with your email
   - Go to Supabase Dashboard → Table Editor → profiles
   - Find your user and set `role` to `admin`
