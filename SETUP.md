# AICTE Complaint Monitoring System - Setup Guide

Complete setup instructions for deploying the AICTE Integrated Institution Complaint Monitoring and Status Dashboard.

---

## Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn** package manager
- **Supabase account** (free tier works for development)
- Modern web browser (Chrome, Firefox, Edge, Safari)

---

## Part 1: Supabase Setup

### 1.1 Create Supabase Project

1. Visit https://app.supabase.com
2. Sign in or create a new account
3. Click **"New Project"**
4. Fill in project details:
   - **Name**: AICTE Complaint Monitoring
   - **Database Password**: (generate a strong password - save it securely)
   - **Region**: Choose closest to your deployment region
5. Wait 2-3 minutes for the project to initialize

### 1.2 Apply Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL editor
5. Click **"Run"** or press Ctrl+Enter
6. Wait for completion (should take 10-20 seconds)
7. Verify success - you should see "Success. No rows returned"

### 1.3 Load Seed Data

1. Still in SQL Editor, create another **New Query**
2. Copy the entire contents of `supabase/seed.sql`
3. Paste and click **"Run"**
4. Verify success - bureaus, regional offices, and SLA rules should be inserted

### 1.4 Create Storage Bucket

1. Go to **Storage** in the left sidebar
2. Click **"New Bucket"**
3. Name it: `case-documents`
4. Make it **Private** (not public)
5. Click **"Create Bucket"**

### 1.5 Configure Storage Policies

Go to the Storage bucket `case-documents` → **Policies** → Add these policies:

**Policy 1: Allow authenticated users to upload**
```sql
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'case-documents');
```

**Policy 2: Allow users to read documents they have access to**
```sql
CREATE POLICY "Users can read authorized documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'case-documents' AND
  EXISTS (
    SELECT 1 FROM case_documents
    WHERE storage_path = name
      AND (
        -- System admins can see all
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('system_administrator', 'competent_authority', 'auditor'))
        OR
        -- Users can see documents for cases they can access
        EXISTS (
          SELECT 1 FROM cases
          WHERE cases.id = case_documents.case_id
            AND (
              EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND bureau_id = cases.bureau_id)
              OR cases.assigned_officer_id = auth.uid()
            )
        )
      )
  )
);
```

### 1.6 Get API Keys

1. Go to **Settings** → **API**
2. Copy the following values (you'll need them in Part 2):
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

⚠️ **NEVER commit the `service_role` key to version control. The anon key is safe for frontend use.**

---

## Part 2: Application Setup

### 2.1 Clone and Install

```cmd
cd e:\SIH2k26 WILDCARD\complaint-management-system-1-main\complaint-management-system-1-main
npm install
```

This will install all dependencies including:
- React 19
- Supabase client
- i18next for multilingual support
- Existing UI libraries

### 2.2 Configure Environment Variables

1. Copy the example environment file:
```cmd
copy .env.example .env.local
```

2. Edit `.env.local` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the placeholder values with the ones you copied in step 1.6.

⚠️ **Never commit `.env.local` to version control!**

### 2.3 Verify Configuration

Run a quick test to ensure Supabase connection works:

```cmd
npm run dev
```

Open http://localhost:5173 and check the browser console for errors. You should see:
- No Supabase connection errors
- Database tables accessible (check Network tab)

---

## Part 3: Create First Admin User

You need at least one system administrator to access the application.

### 3.1 Via Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **"Add User"** → **"Create new user"**
3. Fill in:
   - **Email**: admin@yourdomain.com
   - **Password**: (generate a strong password)
   - **Confirm Password**: (repeat)
   - **Auto Confirm User**: Check this box
4. Click **"Create User"**
5. Copy the **User UID** (looks like: `a1b2c3d4-...`)

### 3.2 Assign Admin Role

Go to **SQL Editor** → **New Query** and run:

```sql
INSERT INTO profiles (id, full_name, email, role)
VALUES (
  'paste-user-uid-here',
  'System Administrator',
  'admin@yourdomain.com',
  'system_administrator'::user_role
);
```

Replace `paste-user-uid-here` with the actual User UID you copied.

### 3.3 Test Login

1. Go to your running application (http://localhost:5173)
2. Navigate to the login page (you'll need to implement this in Phase C)
3. Sign in with the admin credentials

---

## Part 4: Optional - Migrate Demo Data

The application currently has demo data in localStorage. You can optionally migrate it to the database.

### 4.1 Export Demo Data

Open the browser console on the running application and run:

```javascript
const data = localStorage.getItem('casebridge.complaints');
console.log(JSON.parse(data));
```

Copy the output to a file for reference.

### 4.2 Import to Database

Use the provided `migrate_demo_case()` function in seed.sql. For each complaint:

```sql
SELECT migrate_demo_case(
  'CMP-2026-1001',
  'Subject line',
  'Full description',
  'Complainant Name',
  'email@example.com',
  'Institution Name',
  'Category',
  'APR',
  'high',
  'Submitted',
  '2026-10-01T10:00:00Z'::timestamp with time zone
);
```

Repeat for all complaints you want to preserve.

---

## Part 5: Development Workflow

### 5.1 Running Locally

```cmd
npm run dev
```

Application runs at http://localhost:5173

### 5.2 Type Checking

```cmd
npx tsc --noEmit
```

### 5.3 Building for Production

```cmd
npm run build
```

Output will be in `dist/` folder.

### 5.4 Preview Production Build

```cmd
npm run preview
```

---

## Part 6: Deployment

### 6.1 Netlify Deployment

1. Create a Netlify account at https://netlify.com
2. Connect your Git repository
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Add environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy

### 6.2 Vercel Deployment

1. Create a Vercel account at https://vercel.com
2. Import your Git repository
3. Vercel auto-detects Vite settings
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy

### 6.3 Custom Server

Build the application:
```cmd
npm run build
```

Serve the `dist/` folder using any static file server:
- **nginx**: Configure as SPA with fallback to index.html
- **Apache**: Use `.htaccess` with mod_rewrite
- **Node.js**: Use `serve` package

Example with `serve`:
```cmd
npm install -g serve
serve -s dist -l 3000
```

---

## Part 7: Post-Deployment Checklist

- [ ] Database schema applied successfully
- [ ] Seed data loaded (bureaus, regional offices, SLA rules)
- [ ] Storage bucket created and policies configured
- [ ] Environment variables set correctly
- [ ] At least one admin user created
- [ ] Admin user can log in
- [ ] Cases can be created
- [ ] Documents can be uploaded
- [ ] Notifications work
- [ ] Search and filters function
- [ ] Reports generate correctly
- [ ] CSV export works
- [ ] All three languages (English/Hindi/Marathi) display correctly

---

## Part 8: Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution**: Ensure `.env.local` exists and contains valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### Issue: "Failed to fetch" or CORS errors

**Solution**: 
1. Check that your Supabase URL is correct
2. Verify the anon key is correct
3. Ensure Supabase project is active (not paused)

### Issue: "Row Level Security Policy violation"

**Solution**: 
1. Check that RLS policies are properly applied (re-run schema.sql if needed)
2. Verify user has a profile record in the `profiles` table
3. Confirm user role is set correctly

### Issue: "Cannot upload documents"

**Solution**:
1. Verify storage bucket `case-documents` exists
2. Check storage policies are applied
3. Ensure bucket is set to Private (not Public)

### Issue: Database queries are slow

**Solution**:
1. Check if indexes are created (they're in schema.sql)
2. Run `ANALYZE` on large tables:
```sql
ANALYZE cases;
ANALYZE case_actions;
ANALYZE institutions;
```

### Issue: Translation not showing

**Solution**:
1. Clear browser cache
2. Check browser console for i18n errors
3. Verify JSON files in `src/i18n/locales/` are valid
4. Ensure language is properly set in localStorage

---

## Part 9: Security Considerations

### Production Checklist

- [ ] Changed default admin password
- [ ] Reviewed all RLS policies
- [ ] Enabled Supabase email confirmations (Settings → Auth)
- [ ] Configured password requirements (Settings → Auth → Policies)
- [ ] Set up proper CORS origins in Supabase
- [ ] Enabled Supabase audit logging
- [ ] Set up database backups (automatic in Supabase)
- [ ] Reviewed user roles and permissions
- [ ] Tested file upload size limits
- [ ] Verified internal notes are not exposed to unauthorized users

---

## Part 10: Maintenance

### Daily Backup

Supabase provides automatic daily backups. To manually export:

1. Go to **Database** → **Backups**
2. Click **"Create Backup"**
3. Download when ready

### Monitoring

1. **Supabase Dashboard**:
   - Database size and connection pool
   - API request rate
   - Storage usage

2. **Application Monitoring**:
   - Set up error tracking (e.g., Sentry)
   - Monitor page load times
   - Track failed authentication attempts

### Updates

1. **Dependencies**: Run `npm outdated` monthly
2. **Supabase**: Watch for platform updates
3. **Database**: Create migration files for schema changes

---

## Support & Documentation

- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev
- **i18next Docs**: https://www.i18next.com
- **Project Roadmap**: See `IMPLEMENTATION_ROADMAP.md`

---

## Next Steps

After completing this setup:

1. Review `IMPLEMENTATION_ROADMAP.md` for implementation status
2. Proceed with Phase C: Authentication System
3. Test all functionality thoroughly
4. Customize branding and terminology as needed
5. Add real institution data
6. Configure email notifications (if required)

---

**Last Updated**: Phase B Complete  
**Status**: Database ready, translations complete, authentication pending
