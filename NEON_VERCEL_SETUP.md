# Neon + Vercel Setup Guide

## Fixed Issues ✅

1. **Removed infinite build loop** - Eliminated the `vercel-build` script that was causing recursive builds
2. **Simplified vercel.json** - Removed unnecessary routing and environment variables that Vercel handles automatically
3. **Optimized for Neon integration** - Configuration now follows Neon's best practices

## Next Steps: Set Up Neon Postgres Previews Integration

### 1. Install Neon Integration in Vercel

1. Go to [Vercel Marketplace - Neon](https://vercel.com/marketplace/neon)
2. Click **Install**
3. Select **Link Existing Neon Account**
4. Choose your Vercel project
5. Connect to your Neon project and select:
   - Database: `neondb` (or your database name)
   - Role: `neondb_owner` (or your role)

### 2. Environment Variables

The integration will automatically set:

- `DATABASE_URL` (pooled connection)
- `DATABASE_URL_UNPOOLED` (direct connection)

### 3. Database Schema Migration (Optional)

If you have schema changes, add this to Vercel Build Settings:

**Build Command:**

```bash
npm run build
```

**Install Command:**

```bash
npm install
```

If you use Prisma or similar:

```bash
npx prisma migrate deploy && npm run build
```

### 4. Database Initialization

Your `scripts/init-postgres.ts` should only be run once during initial setup, not during builds.

**For local development:**

```bash
npm run db:init-postgres
```

**For production:** Use the Neon Console or run the script once manually.

## Benefits of This Setup

✅ **No more infinite build loops**
✅ **Automatic database branches for preview deployments**
✅ **Proper environment variable management**
✅ **Optimized build performance**
✅ **Follows Neon + Vercel best practices**

## Troubleshooting

### If you get environment variable conflicts:

1. Go to Vercel Project Settings > Environment Variables
2. Remove any existing `DATABASE_URL` or `PGHOST` variables
3. Reinstall the Neon integration

### If builds still fail:

1. Check that no other integrations are setting database variables
2. Ensure your Neon project has stored passwords (projects created after March 2023)
3. Verify the selected role exists in your Neon project

## Database Connection in Code

Your existing `lib/db.ts` should work with the environment variables set by Neon:

```typescript
// Uses DATABASE_URL automatically
const connectionString = process.env.DATABASE_URL;
```

## Preview Deployments

With the integration:

1. Each Git branch creates a Neon database branch
2. Preview deployments get their own isolated database
3. Branches are automatically cleaned up when Git branches are merged/deleted

## Production Deployment

Your main branch will use your Neon project's default branch for production data.
