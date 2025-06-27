# 🚀 Virtual Varsity API Endpoints

Complete list of all API endpoints converted to Vercel serverless functions.

## 📋 Endpoint Summary

### Authentication Endpoints

| Method | Endpoint             | File                   | Description           |
| ------ | -------------------- | ---------------------- | --------------------- |
| POST   | `/api/auth/register` | `api/auth/register.ts` | User registration     |
| POST   | `/api/auth/login`    | `api/auth/login.ts`    | User login            |
| GET    | `/api/auth/me`       | `api/auth/me.ts`       | Get current user info |

### Module Endpoints

| Method | Endpoint              | File                    | Description             |
| ------ | --------------------- | ----------------------- | ----------------------- |
| GET    | `/api/modules`        | `api/modules/index.ts`  | Get all modules         |
| POST   | `/api/modules`        | `api/modules/index.ts`  | Create new module       |
| GET    | `/api/modules/:id`    | `api/modules/[id].ts`   | Get specific module     |
| POST   | `/api/modules/upload` | `api/modules/upload.ts` | Upload module from JSON |

### Progress Endpoints

| Method | Endpoint                                      | File                                              | Description              |
| ------ | --------------------------------------------- | ------------------------------------------------- | ------------------------ |
| GET    | `/api/progress/:userId`                       | `api/progress/[userId].ts`                        | Get all user progress    |
| GET    | `/api/progress/:userId/lessons`               | `api/progress/[userId]/lessons.ts`                | Get user lesson progress |
| GET    | `/api/progress/:userId/certificates`          | `api/progress/[userId]/certificates.ts`           | Get user certificates    |
| GET    | `/api/progress/:userId/:moduleId`             | `api/progress/[userId]/[moduleId].ts`             | Get module progress      |
| GET    | `/api/progress/:userId/:moduleId/:lessonId`   | `api/progress/[userId]/[moduleId]/[lessonId].ts`  | Get lesson progress      |
| POST   | `/api/progress/lesson`                        | `api/progress/lesson.ts`                          | Update lesson progress   |
| POST   | `/api/progress/certificate`                   | `api/progress/certificate.ts`                     | Generate certificate     |
| GET    | `/api/progress/certificate/:userId/:moduleId` | `api/progress/certificate/[userId]/[moduleId].ts` | Get certificate          |
| GET    | `/api/progress/verify/:certificateCode`       | `api/progress/verify/[certificateCode].ts`        | Verify certificate       |
| POST   | `/api/progress/reset`                         | `api/progress/reset.ts`                           | Reset progress           |

### System Endpoints

| Method | Endpoint      | File            | Description      |
| ------ | ------------- | --------------- | ---------------- |
| GET    | `/api/health` | `api/health.ts` | API health check |

## 🔧 Database Functions

All database functions have been converted from SQLite to PostgreSQL in `lib/api.ts`:

### Module Functions

- `getModules()` - Get all modules
- `getModuleById(id)` - Get specific module
- `saveModule(moduleData)` - Save new module

### Progress Functions

- `getUserProgress(userId, moduleId)` - Get user progress for module
- `updateLessonProgress(userId, moduleId, lessonId, completed, timeSpent, quizScore)` - Update lesson progress
- `updateModuleProgress(userId, moduleId)` - Update module-level progress
- `getLessonProgress(userId, moduleId, lessonId)` - Get lesson progress
- `getModuleProgressDetailed(userId, moduleId)` - Get detailed module progress
- `getAllUserProgress(userId)` - Get all user progress
- `getAllLessonProgress(userId)` - Get all lesson progress
- `getAllUserCertificates(userId)` - Get all user certificates

### Certificate Functions

- `generateCertificate(userId, moduleId)` - Generate certificate
- `getCertificate(userId, moduleId)` - Get certificate
- `verifyCertificate(certificateCode)` - Verify certificate
- `resetModuleProgress(userId, moduleId)` - Reset progress

### Auth Functions

- `registerUser(username, email, password)` - Register new user
- `loginUser(email, password)` - Login user
- `verifyToken(token)` - Verify JWT token
- `getUserById(id)` - Get user by ID

## 🎯 Migration Status

✅ **COMPLETE**: All API endpoints have been converted from Express routes to Vercel serverless functions

### What Was Converted:

1. **Express Routes** → **Vercel API Routes**
2. **SQLite Database** → **PostgreSQL Database**
3. **Local Server** → **Serverless Functions**
4. **File-based routing** → **Vercel routing**

### Key Changes:

- All endpoints now return proper JSON responses
- Database queries use PostgreSQL syntax (`$1`, `$2` instead of `?`)
- Error handling is consistent across all endpoints
- Authentication uses JWT tokens
- All functions are async/await compatible

## 🚀 Deployment Ready

Your app now has:

- ✅ All API endpoints converted
- ✅ PostgreSQL database support
- ✅ Vercel serverless functions
- ✅ Proper error handling
- ✅ JWT authentication
- ✅ Database-agnostic design

## 🔄 Testing Endpoints

After deployment, you can test endpoints:

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Register user
curl -X POST https://your-app.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'

# Get modules
curl https://your-app.vercel.app/api/modules
```

## 🎉 Result

**No more "Unexpected token 'T'" errors!** All API calls will now return proper JSON responses instead of HTML error pages.
