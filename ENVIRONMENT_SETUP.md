# Offline/Online Learning Platform Setup

This application uses an intelligent API client that automatically detects whether users are in offline or online mode and routes data accordingly, making education accessible even in areas with limited internet connectivity.

## 🏗️ Architecture

### Offline Mode (Local Storage + Express)

- **Backend**: Local Express server on `http://localhost:3001`
- **Database**: SQLite (`database/virtual-varsity.db`) - stored locally
- **Token Storage**: `token_local` in localStorage
- **API Endpoints**: All routes prefixed with `/api/*`
- **Use Case**: Rural areas, limited internet, offline learning

### Online Mode (Cloud + Vercel)

- **Backend**: Vercel serverless functions
- **Database**: PostgreSQL (cloud-hosted)
- **Token Storage**: `token_production` in localStorage
- **API Endpoints**: All routes prefixed with `/api/*`
- **Use Case**: Urban areas, reliable internet, cloud-based learning

## 🔧 Mode Detection

The API client automatically detects the learning mode based on:

- **Offline Mode**: `window.location.hostname === 'localhost'` or `'127.0.0.1'`
- **Online Mode**: Any other hostname (deployed domain)

## 🚀 Getting Started

### Local Development

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Initialize SQLite database**:

   ```bash
   npm run db:init
   ```

3. **Start development servers**:

   ```bash
   npm run dev
   ```

   This runs both the Express server (port 3001) and Vite dev server (port 5173) concurrently.

4. **Access the app**:
   - Frontend: `http://localhost:5173`
   - API: `http://localhost:3001/api/*`

### Production Deployment

1. **Set up PostgreSQL database** (if not already done):

   ```bash
   npm run db:init-postgres
   ```

2. **Configure environment variables** in Vercel:

   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-production-secret
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel deploy
   ```

## 🔄 API Client Usage

The API client is automatically imported and used in all hooks:

```typescript
import { apiClient } from "../lib/apiClient";

// The client automatically routes to the correct backend
const result = await apiClient.login({ email, password });
```

### Key Features

- **Automatic Environment Detection**: No manual configuration needed
- **Normalized Error Handling**: Consistent error format across environments
- **Separate Token Storage**: Local and production tokens are stored separately
- **Type Safety**: Full TypeScript support with proper interfaces
- **Health Checks**: Built-in health check endpoint for monitoring

## 🔍 Learning Mode Indicator

The app includes a visual indicator in the bottom-right corner showing:

- **🔵 Blue dot**: Offline Mode - Learning without internet (SQLite + Local storage)
- **🟢 Green dot**: Online Mode - Cloud-based learning (PostgreSQL + Vercel)
- **Health status**: Connection status and backend response
- **Mode description**: Clear indication of current learning mode

## 📝 API Endpoints

All endpoints are available in both environments:

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Modules

- `GET /api/modules`
- `GET /api/modules/:id`
- `POST /api/modules`
- `POST /api/modules/upload`

### Progress

- `GET /api/progress/:userId`
- `GET /api/progress/:userId/lessons`
- `GET /api/progress/:userId/certificates`
- `POST /api/progress/lesson`
- `POST /api/progress/certificate`

### Health

- `GET /api/health`

## 🛠️ Development Tips

1. **Database Reset**: Delete `src/server/database.db` and run `npm run db:init` to reset local data
2. **Token Issues**: Clear localStorage or use different browsers for testing different environments
3. **CORS**: The Express server is configured with CORS for local development
4. **Hot Reload**: Both frontend and backend support hot reload during development

## 🔧 Troubleshooting

### "Connection failed" in Learning Mode Indicator

- **Offline Mode**: Make sure Express server is running (`npm run server`)
- **Online Mode**: Check Vercel deployment and database connection

### Authentication Issues

- **Offline Mode**: Check if SQLite database exists and has users table
- **Online Mode**: Verify PostgreSQL connection and JWT_SECRET

### Module Loading Issues

- **Offline Mode**: Ensure modules are saved to SQLite database
- **Online Mode**: Check PostgreSQL database and Vercel function logs

### Switching Between Modes

- **From Online to Offline**: Download the app locally and run `npm run dev`
- **From Offline to Online**: Deploy to a domain and access via internet
- **Data Sync**: Currently, data doesn't sync between modes (future enhancement)

## 📊 Monitoring

The environment indicator provides real-time status:

- **✅ OK**: Backend is responding correctly
- **❌ Failed**: Backend connection or database issues
- **❌ Connection failed**: Network or server issues

For production monitoring, check:

- Vercel function logs
- PostgreSQL connection status
- Environment variable configuration
