# 🚀 Deployment Guide - Fix Registration Error

This guide will help you deploy your Virtual Varsity app to Vercel and fix the "Unexpected token 'T'" JSON parsing error.

## 🎯 What We Fixed

**The Problem**: When clicking "Register", you got a JSON parsing error because:

- Your app was trying to call `/api/auth/register`
- Vercel returned a 404 HTML page instead of JSON
- Your frontend tried to parse HTML as JSON → Error!

**The Solution**: We converted your Express server to Vercel serverless functions:

- ✅ Proper API routes that return JSON
- ✅ PostgreSQL database (works on serverless)
- ✅ Database-agnostic design (easy to switch providers)

## 📋 Pre-Deployment Checklist

- [ ] Code is committed to Git repository
- [ ] Repository is pushed to GitHub/GitLab/Bitbucket
- [ ] You have a Vercel account

## 🚀 Step-by-Step Deployment

### Step 1: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com) and sign in**

2. **Click "New Project"**

3. **Import your repository**

   - Select your Git provider
   - Choose your repository
   - Click "Import"

4. **Configure Project**

   - Project Name: `virtual-varsity` (or your preferred name)
   - Framework Preset: Vercel will auto-detect "Vite"
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)

5. **Click "Deploy"**
   - Vercel will build your project
   - This first deployment will fail (expected) because we need a database

### Step 2: Set Up Database

1. **In your Vercel dashboard, go to your project**

2. **Click on the "Storage" tab**

3. **Click "Create Database"**

4. **Select "Postgres"**

   - Choose a database name (e.g., `virtual-varsity-db`)
   - Select a region (choose closest to your users)
   - Click "Create"

5. **Copy the connection string**
   - Go to the `.env.local` tab in your database
   - Copy the `POSTGRES_URL` value

### Step 3: Configure Environment Variables

1. **In your Vercel project, go to "Settings" → "Environment Variables"**

2. **Add these variables:**

   ```
   Name: POSTGRES_URL
   Value: [paste your database connection string]
   Environment: Production, Preview, Development
   ```

   ```
   Name: JWT_SECRET
   Value: [generate a random secret key]
   Environment: Production, Preview, Development
   ```

   **To generate a JWT secret:**

   ```bash
   # Option 1: Use Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Option 2: Use online generator
   # Go to https://generate-secret.vercel.app/32
   ```

3. **Click "Save" for each variable**

### Step 4: Redeploy

1. **Go to "Deployments" tab**

2. **Click the three dots (⋯) on the latest deployment**

3. **Click "Redeploy"**

4. **Wait for deployment to complete**

### Step 5: Initialize Database

Your database will be automatically initialized on the first API call. To manually initialize:

1. **Go to your deployed app URL**
2. **Try to register a new account**
3. **The database will be created automatically**

Or use the Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Run database initialization
vercel env pull .env.local
npm run db:init-postgres
```

## ✅ Testing Your Deployment

1. **Visit your deployed app** (e.g., `https://your-app.vercel.app`)

2. **Test Registration**:

   - Click "Register" or go to `/auth/register`
   - Fill out the form
   - Click "Create Account"
   - ✅ Should work without JSON parsing errors!

3. **Test Login**:
   - Go to `/auth/login`
   - Use the credentials you just created
   - ✅ Should log you in successfully

## 🔧 Troubleshooting

### Registration Still Fails?

**Check the browser console:**

```javascript
// Open browser dev tools (F12)
// Look for errors in Console tab
```

**Common issues:**

- Environment variables not set correctly
- Database connection string is wrong
- JWT_SECRET is missing

### Database Connection Issues?

1. **Verify environment variables in Vercel dashboard**
2. **Check database is running in Vercel Storage tab**
3. **Try redeploying after fixing env vars**

### Build Failures?

1. **Check the build logs in Vercel dashboard**
2. **Common fixes:**

   ```bash
   # Update dependencies
   npm install

   # Fix TypeScript errors
   npm run lint
   ```

## 🔄 Switching Database Providers Later

Your app is designed to be database-agnostic. To switch:

### To Supabase:

1. Create Supabase project
2. Get connection string
3. Update `DATABASE_URL` in Vercel env vars
4. Redeploy

### To Railway:

1. Create Railway PostgreSQL database
2. Get connection string
3. Update `DATABASE_URL` in Vercel env vars
4. Redeploy

### To Your Own PostgreSQL:

1. Set up your PostgreSQL server
2. Update `DATABASE_URL` in Vercel env vars
3. Run `npm run db:init-postgres` to initialize
4. Redeploy

## 🎉 Success!

Once deployed successfully:

- ✅ Registration works without JSON errors
- ✅ Login works properly
- ✅ Database is persistent
- ✅ App scales automatically
- ✅ Easy to switch database providers

Your Virtual Varsity app is now production-ready! 🚀

---

**Need help?** Check the main README.md or open an issue.
