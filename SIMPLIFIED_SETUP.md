# Simplified Setup (Client-Side Firebase Only)

This version of DaanaRX uses **client-side Firebase SDK only**, which means:
- ✅ No Firebase Admin SDK required
- ✅ No service account key needed
- ✅ Simpler setup process
- ✅ All database operations handled by the frontend

## Quick Setup

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Configure Environment (Optional)

The `.env.example` already has your Firebase config. If you want to create your own `.env` file:

```bash
cp .env.example .env
```

Your Firebase config (already set):
- Project: `daanarx-a`
- API Key: `AIzaSyD_XSYIaZF2l5FIVrwLn0TxwHGx2vk1w30`
- Auth Domain: `daanarx-a.firebaseapp.com`

### 3. Verify Firebase Settings

Make sure in Firebase Console:
1. **Firestore Database** is enabled (test mode is fine)
2. **Anonymous Authentication** is enabled

### 4. Start the Application
```bash
npm run dev
```

That's it! Open http://localhost:3000

## What Changed from Original Setup?

### Removed
- ❌ Firebase Admin SDK dependency
- ❌ `server/firebase-adminsdk.json` file requirement
- ❌ Service account key download step
- ❌ Backend database operations

### Kept
- ✅ All frontend functionality
- ✅ Real-time Firebase updates
- ✅ NDC lookup API (via backend proxy)
- ✅ All original features

## Architecture

```
Frontend (React)
    ↓
Firebase SDK (client-side)
    ↓
Firebase Firestore
```

The backend now only serves as:
1. **API proxy** for openFDA (NDC lookups)
2. **Static file server** (optional)

All database operations (CRUD) happen directly from the React app to Firebase.

## Advantages

1. **Simpler Setup**: No service account keys to manage
2. **Faster Development**: Direct Firebase connection from frontend
3. **Real-time Updates**: Native Firebase real-time listeners
4. **No Server Required**: Can deploy as static site

## Security Notes

### Development (Current)
- Firestore security rules should be in **test mode**
- Anyone can read/write during development

### Production (Required)
Update Firestore rules to:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

This ensures only authenticated users can access data.

## Troubleshooting

### "Permission denied" errors
- Check that Firestore is in test mode (development)
- Or ensure security rules allow your access

### "Firebase not initialized"
- Verify Firebase config in `.env.example` or `.env`
- Check that all `REACT_APP_FIREBASE_*` variables are set

### Backend won't start
- The backend is now minimal - it only needs to run for NDC lookups
- If you don't need NDC lookups, the backend is optional!

## Optional: Backend-Only Mode

If you want to skip the backend entirely:

1. **Remove NDC Lookup**: Comment out NDC lookup in CheckIn view
2. **Deploy Frontend Only**: Deploy to Vercel, Netlify, or Firebase Hosting
3. **Manual Entry**: Users enter drug info manually

## Deployment Options

### Option 1: Full Stack (Recommended)
- Frontend: Firebase Hosting / Vercel / Netlify
- Backend: Railway / Heroku (for NDC lookups)

### Option 2: Frontend Only
- Deploy React app to any static hosting
- Skip backend deployment
- Manual drug entry only

### Option 3: Firebase Hosting Only
```bash
npm run build
firebase deploy
```

## Still Need Admin SDK?

If you want to use Firebase Admin SDK for server-side operations:

1. Download service account key from Firebase Console
2. Place in `server/firebase-adminsdk.json`
3. Reinstall firebase-admin: `npm install firebase-admin`
4. Restore the original `server/index.js` from git history

But for most use cases, client-side Firebase is sufficient!

## Questions?

- See main `README.md` for full documentation
- See `GETTING_STARTED.md` for user guide
- Check `ARCHITECTURE.md` for technical details

