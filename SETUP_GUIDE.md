# Quick Setup Guide for DaanaRX

This is a streamlined setup guide to get you up and running quickly.

## Prerequisites Checklist

- [ ] Node.js v16+ installed
- [ ] npm v7+ installed
- [ ] Firebase account created
- [ ] Git installed (optional)

## Step-by-Step Setup

### 1. Firebase Project Setup (5 minutes)

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com/
   - Click "Add project"
   - Name it (e.g., "DaanaRX")
   - Disable Google Analytics (optional)

2. **Enable Firestore**
   - Click "Firestore Database" in sidebar
   - Click "Create database"
   - Select "Start in test mode"
   - Choose your region

3. **Enable Anonymous Authentication**
   - Click "Authentication" in sidebar
   - Click "Get started"
   - Go to "Sign-in method" tab
   - Enable "Anonymous"

4. **Get Web Config**
   - Click gear icon → "Project settings"
   - Scroll down to "Your apps"
   - Click web icon `</>`
   - Register app (nickname: DaanaRX)
   - Copy the `firebaseConfig` object

5. **Download Admin SDK Key**
   - Still in Project Settings
   - Go to "Service accounts" tab
   - Click "Generate new private key"
   - Save as `firebase-adminsdk.json`

### 2. Local Project Setup (3 minutes)

1. **Navigate to project**
   ```bash
   cd /Users/rithik/Code/DaanarRX
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Edit .env file**
   - Open `.env` in a text editor
   - Replace the `REACT_APP_FIREBASE_*` values with your Firebase config
   - Save the file

4. **Place Admin SDK Key**
   - Move `firebase-adminsdk.json` to `/Users/rithik/Code/DaanarRX/server/`

5. **Install dependencies**
   ```bash
   npm run install-all
   ```
   (This installs both backend and frontend dependencies)

### 3. Start the Application (1 minute)

```bash
npm run dev
```

This starts both the backend (port 5000) and frontend (port 3000).

### 4. Access the App

Open your browser to:
```
http://localhost:3000
```

You should see the DaanaRX home screen!

## First Steps in the App

1. **Create a Location** (Admin page)
   - Click "Admin"
   - Add a location like "Shelf A-1" (Room Temp)

2. **Check In Stock** (Check In page)
   - Click "Check In"
   - Create a lot (today's date, source name)
   - Try scanning an NDC or enter manually
   - Fill in unit details
   - Generate and print label

3. **Test the System**
   - Go to Inventory to see your unit
   - Use Scan/Lookup to find it by Unit ID
   - Try checking it out
   - View the transaction in Reports

## Common Issues

### Port Already in Use
```bash
# Find what's using port 5000
lsof -ti:5000

# Kill the process
kill -9 $(lsof -ti:5000)
```

### Firebase Connection Error
- Double-check your `.env` file has correct Firebase config
- Make sure Firestore and Authentication are enabled
- Check that `firebase-adminsdk.json` is in the `server/` directory

### "Cannot find module" Error
```bash
# Reinstall dependencies
rm -rf node_modules client/node_modules
npm install
cd client && npm install
```

## Environment Variables Quick Reference

Your `.env` should look like:

```env
PORT=5000
NODE_ENV=development
FIREBASE_ADMIN_SDK_PATH=./server/firebase-adminsdk.json

REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123:web:abc123
REACT_APP_FIREBASE_MEASUREMENT_ID=G-ABC123
```

## Need Help?

1. Check the full README.md for detailed documentation
2. Verify all Firebase services are enabled
3. Check the browser console (F12) for errors
4. Check the terminal for backend errors

## Next Steps

- Set up Firebase security rules for production
- Customize the app for your workflow
- Add more locations
- Import existing inventory
- Train your team

Enjoy using DaanaRX! 🎉

