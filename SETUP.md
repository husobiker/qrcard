# QR Vizit - Complete Setup Guide

This guide will walk you through setting up the QR Vizit application from scratch.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier works)
- A Vercel account (for deployment)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

### 2.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: QR Vizit (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be set up (takes 1-2 minutes)

### 2.2 Run Database Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click "Run" (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

### 2.3 Create Storage Bucket

1. Go to **Storage** in the Supabase dashboard
2. Click "Create bucket"
3. Name: `company-assets`
4. **Make it public**: Toggle "Public bucket" to ON
5. Click "Create bucket"

### 2.4 Get API Keys

1. Go to **Settings** > **API**
2. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

## Step 3: Configure Environment Variables

1. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

2. Open `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace:
- `your-project-id` with your actual Supabase project ID
- `your-anon-key-here` with your actual anon key

## Step 4: Run Development Server

```bash
npm run dev
```

The app should open at `http://localhost:5173`

## Step 5: Test the Application

1. **Sign Up**: Go to `/signup` and create a company account
2. **Login**: Use your credentials to log in
3. **Company Profile**: Update your company information
4. **Add Employee**: Go to Employees page and add a test employee
5. **Generate QR**: Click "QR Code" button to see the QR code
6. **View Public Profile**: Copy the public URL and open it in a new tab

## Step 6: Deploy to Vercel

### 6.1 Prepare for Deployment

1. Push your code to GitHub (if not already done)
2. Make sure `.env` is in `.gitignore` (it should be)

### 6.2 Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Sign up or log in
3. Click "Add New" > "Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
7. Click "Deploy"

### 6.3 Configure Supabase for Production

1. In Supabase dashboard, go to **Authentication** > **URL Configuration**
2. Add your Vercel domain to **Redirect URLs**:
   - `https://your-app.vercel.app/**`
3. Update **Site URL** to your Vercel domain:
   - `https://your-app.vercel.app`
4. Save changes

## Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution**: Make sure your `.env` file exists and has the correct variable names (they must start with `VITE_`)

### Issue: "Error fetching company" or "Error fetching employees"

**Solution**: 
1. Check that you ran the SQL migration
2. Verify RLS policies are enabled in Supabase
3. Check browser console for specific error messages

### Issue: "Storage bucket not found"

**Solution**: 
1. Go to Supabase Storage
2. Make sure `company-assets` bucket exists
3. Verify it's set to public

### Issue: Images not uploading

**Solution**:
1. Check storage bucket policies in Supabase
2. Verify bucket is public
3. Check file size (Supabase free tier has limits)

### Issue: QR code not generating

**Solution**:
1. Check browser console for errors
2. Verify the public URL is correct
3. Make sure `html2canvas` is installed: `npm install html2canvas`

## Project Structure

```
qr-vizit/
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Shadcn UI components
│   │   ├── Layout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── QRCodeGenerator.tsx
│   ├── pages/
│   │   ├── auth/         # Login, Signup, etc.
│   │   ├── dashboard/    # Dashboard pages
│   │   └── public/       # Public employee profiles
│   ├── services/         # API service functions
│   ├── supabase/         # Supabase config
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities
│   └── types/            # TypeScript types
├── supabase/
│   └── migrations/       # Database migrations
├── .env.example          # Environment variables template
├── package.json
├── vite.config.ts
└── README.md
```

## Next Steps

- Customize the branding and colors
- Add more social media platforms
- Implement analytics
- Add email notifications
- Customize the public profile design

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase logs in the dashboard
3. Verify all environment variables are set correctly
4. Make sure all migrations have been run

## License

MIT

