# Virtual Varsity - Production Ready

A modern learning management system built with React, TypeScript, and PostgreSQL, optimized for Vercel deployment.

## 🚀 Quick Deploy to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/virtual-varsity)

### Option 2: Manual Deploy

1. **Fork/Clone this repository**
2. **Connect to Vercel**

   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Vercel will auto-detect the configuration

3. **Set up Database**

   - In your Vercel dashboard, go to Storage tab
   - Create a new Postgres database
   - Copy the connection string

4. **Configure Environment Variables**

   ```bash
   POSTGRES_URL=your-vercel-postgres-connection-string
   JWT_SECRET=your-super-secret-jwt-key-change-this
   ```

5. **Deploy**
   - Vercel will automatically build and deploy
   - Your app will be live at `https://your-app.vercel.app`

## 🔧 Database Setup

### Automatic Setup (Recommended)

The database will be automatically initialized on first deployment. No manual setup required!

### Manual Setup (If Needed)

If you need to manually initialize the database:

```bash
# Install dependencies
npm install

# Set your DATABASE_URL environment variable
export POSTGRES_URL="your-connection-string"

# Initialize database
npm run db:init-postgres
```

## 🔄 Database Migration Guide

This app is designed to be database-agnostic. You can easily switch between providers:

### Switch to Supabase

1. Create a Supabase project
2. Get your connection string
3. Update environment variable: `DATABASE_URL=your-supabase-connection`
4. Redeploy

### Switch to Your Own PostgreSQL

1. Set up your PostgreSQL instance
2. Update environment variable: `DATABASE_URL=your-postgresql-connection`
3. Run: `npm run db:init-postgres`
4. Redeploy

### Switch to Other Providers

- **Railway**: `DATABASE_URL=railway-connection`
- **Neon**: `DATABASE_URL=neon-connection`
- **PlanetScale**: Minor code changes needed for MySQL syntax

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database connection

# Initialize database (if using local PostgreSQL)
npm run db:init-postgres

# Start development server
npm run dev
```

## 📁 Project Structure

```
├── api/                    # Vercel API routes (serverless functions)
│   └── auth/              # Authentication endpoints
├── lib/                   # Shared utilities
│   ├── db.ts             # Database connection (works with any PostgreSQL)
│   └── schema.sql        # PostgreSQL schema
├── src/                   # React frontend
├── scripts/              # Database initialization scripts
└── vercel.json           # Vercel configuration
```

## 🔐 Environment Variables

| Variable       | Description                  | Required |
| -------------- | ---------------------------- | -------- |
| `POSTGRES_URL` | PostgreSQL connection string | ✅       |
| `DATABASE_URL` | Alternative to POSTGRES_URL  | ✅       |
| `JWT_SECRET`   | Secret key for JWT tokens    | ✅       |

## 🚨 Troubleshooting

### "Unexpected token 'T'" Error

This was the original issue - it occurred because API calls were returning HTML error pages instead of JSON. This is now fixed with proper Vercel API routes.

### Database Connection Issues

1. Verify your connection string is correct
2. Ensure your database allows connections from Vercel IPs
3. Check that environment variables are set in Vercel dashboard

### Build Failures

1. Ensure all dependencies are in `package.json`
2. Check that TypeScript types are properly installed
3. Verify `vercel.json` configuration

## 🔄 Migration from SQLite

If you're migrating from the SQLite version:

1. **Data Export**: Export your SQLite data to SQL format
2. **Schema Conversion**: The PostgreSQL schema is already provided
3. **Data Import**: Import your data to the new PostgreSQL database
4. **Deploy**: Deploy the new version

## 📊 Features

- ✅ **User Authentication** - Register, login, JWT tokens
- ✅ **Module Management** - Course modules with lessons and quizzes
- ✅ **Progress Tracking** - Track user progress through courses
- ✅ **Certificates** - Generate completion certificates
- ✅ **Responsive Design** - Works on all devices
- ✅ **Dark Mode** - Toggle between light and dark themes
- ✅ **Production Ready** - Optimized for Vercel deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Need help?** Open an issue or check the troubleshooting section above.
